package expo.modules.rnbluetoothclassicprinter

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Handler
import android.os.Looper
import android.util.Base64
import android.util.Log
import androidx.core.os.bundleOf
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import java.io.IOException
import java.util.UUID

/**
 * Expo Module for Bluetooth Classic ESC/POS Thermal Printers
 *
 * Provides functionality to:
 * - Check and enable Bluetooth
 * - Scan for nearby devices
 * - Connect/disconnect to printers
 * - Print raw ESC/POS commands (base64 encoded)
 */
class RnBluetoothClassicPrinterModule : Module() {

  companion object {
    private const val ENABLE_BLUETOOTH_REQUEST_CODE = 1001
    private const val TAG = "RNBluetoothPrinter"

    // UUID for SPP (Serial Port Profile) - standard for Bluetooth printers
    private val SPP_UUID: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
  }

  // Bluetooth socket connection
  private var bluetoothSocket: BluetoothSocket? = null

  // Device discovery state
  private var discoveryReceiver: BroadcastReceiver? = null
  private var isDiscovering = false
  private val handler = Handler(Looper.getMainLooper())

  // ============================================================================
  // MODULE DEFINITION
  // ============================================================================

  override fun definition() = ModuleDefinition {
    Name("RnBluetoothClassicPrinter")

    // Events
    Events("onDeviceFound")

    // ============================================================================
    // BLUETOOTH STATUS
    // ============================================================================

    /**
     * Check if Bluetooth is enabled
     */
    Function("isBluetoothEnabled") {
      getBluetoothAdapter()?.isEnabled == true
    }

    /**
     * Request to enable Bluetooth (shows system dialog)
     */
    AsyncFunction("requestEnableBluetooth") { promise: Promise ->
      val adapter = getBluetoothAdapter()

      when {
        adapter == null -> {
          promise.reject("BLUETOOTH_NOT_AVAILABLE", "Bluetooth is not available on this device", null)
        }
        adapter.isEnabled -> {
          promise.resolve(true)
        }
        else -> {
          val activity = appContext.currentActivity
          when (activity) {
            null -> promise.reject("ACTIVITY_NOT_AVAILABLE", "No activity available to show Bluetooth enable dialog", null)
            else -> {
              val enableIntent = Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE)
              activity.startActivityForResult(enableIntent, ENABLE_BLUETOOTH_REQUEST_CODE)
              promise.resolve(true)
            }
          }
        }
      }
    }

    // ============================================================================
    // DEVICE DISCOVERY
    // ============================================================================

    /**
     * Start scanning for Bluetooth devices
     * Emits "onDeviceFound" events as devices are discovered
     */
    AsyncFunction("startScanning") { promise: Promise ->
      val adapter = getBluetoothAdapter()

      when {
        adapter == null -> {
          promise.reject("BLUETOOTH_NOT_AVAILABLE", "Bluetooth is not available on this device", null)
          return@AsyncFunction
        }
        !adapter.isEnabled -> {
          promise.reject("BLUETOOTH_NOT_ENABLED", "Bluetooth is not enabled", null)
          return@AsyncFunction
        }
      }

      // If currently discovering, cancel first
      if (adapter.isDiscovering) {
        Log.d(TAG, "Cancelling existing discovery")
        adapter.cancelDiscovery()
        handler.postDelayed({ startDiscovery(adapter, promise) }, 600)
      } else {
        startDiscovery(adapter, promise)
      }
    }

    /**
     * Stop scanning for Bluetooth devices
     */
    Function("stopScanning") {
      val adapter = getBluetoothAdapter() ?: return@Function false

      if (adapter.isDiscovering) {
        adapter.cancelDiscovery()
      }
      isDiscovering = false
      true
    }

    /**
     * Get paired/bonded Bluetooth devices
     */
    AsyncFunction("getPairedDevices") { promise: Promise ->
      val adapter = getBluetoothAdapter()

      when {
        adapter == null || !adapter.isEnabled -> {
          promise.resolve(emptyList<Any>())
          return@AsyncFunction
        }
      }

      val pairedDevices = adapter.bondedDevices
      val deviceList = pairedDevices.map { device ->
        bundleOf(
          "id" to device.address,
          "name" to (device.name ?: "Unknown")
        )
      }

      Log.d(TAG, "Found ${deviceList.size} paired devices")
      promise.resolve(deviceList)
    }

    // ============================================================================
    // CONNECTION
    // ============================================================================

    /**
     * Connect to a Bluetooth device by MAC address
     */
    AsyncFunction("connectDevice") { deviceId: String, promise: Promise ->
      val adapter = getBluetoothAdapter()

      when {
        adapter == null -> {
          promise.reject("BLUETOOTH_NOT_AVAILABLE", "Bluetooth is not available on this device", null)
          return@AsyncFunction
        }
        !adapter.isEnabled -> {
          promise.reject("BLUETOOTH_NOT_ENABLED", "Bluetooth is not enabled", null)
          return@AsyncFunction
        }
      }

      // Cancel discovery before connecting
      if (adapter.isDiscovering) {
        adapter.cancelDiscovery()
      }

      val device = adapter.getRemoteDevice(deviceId)

      try {
        bluetoothSocket = device.createRfcommSocketToServiceRecord(SPP_UUID)
        bluetoothSocket?.connect()
        Log.d(TAG, "Connected to ${device.name} ($deviceId)")
        promise.resolve(true)
      } catch (e: IOException) {
        Log.e(TAG, "Connection failed", e)
        promise.reject("CONNECTION_FAILED", "Failed to connect to device: ${e.message}", null)
      }
    }

    /**
     * Disconnect from the current device
     */
    AsyncFunction("disconnect") { promise: Promise ->
      try {
        bluetoothSocket?.close()
        bluetoothSocket = null
        Log.d(TAG, "Disconnected")
        promise.resolve(true)
      } catch (e: IOException) {
        Log.e(TAG, "Disconnect failed", e)
        promise.reject("DISCONNECT_FAILED", "Failed to disconnect: ${e.message}", null)
      }
    }

    /**
     * Get the currently connected device
     */
    Function("getConnectedDevice") {
      val socket = bluetoothSocket
      when {
        socket == null || !socket.isConnected -> null
        else -> bundleOf(
          "id" to socket.remoteDevice.address,
          "name" to (socket.remoteDevice.name ?: "Unknown")
        )
      }
    }

    // ============================================================================
    // PRINTING
    // ============================================================================

    /**
     * Print raw ESC/POS commands (base64 encoded)
     */
    AsyncFunction("printRaw") { base64Data: String, promise: Promise ->
      val socket = bluetoothSocket

      when {
        socket == null || !socket.isConnected -> {
          promise.reject("NOT_CONNECTED", "Not connected to any device", null)
          return@AsyncFunction
        }
      }

      try {
        val bytes = Base64.decode(base64Data, Base64.DEFAULT)
        socket.outputStream.write(bytes)
        socket.outputStream.flush()
        Log.d(TAG, "Sent ${bytes.size} bytes")
        promise.resolve(true)
      } catch (e: IllegalArgumentException) {
        Log.e(TAG, "Invalid base64 data", e)
        promise.reject("INVALID_DATA", "Invalid base64 data: ${e.message}", null)
      } catch (e: IOException) {
        Log.e(TAG, "Failed to send data", e)
        promise.reject("PRINT_FAILED", "Failed to send data: ${e.message}", null)
      }
    }

    // ============================================================================
    // CLEANUP
    // ============================================================================

    OnDestroy {
      // Clean up handler callbacks
      handler.removeCallbacksAndMessages(null)

      // Unregister broadcast receiver
      discoveryReceiver?.let {
        try {
          appContext.reactContext?.unregisterReceiver(it)
        } catch (e: Exception) {
          Log.w(TAG, "Failed to unregister receiver: ${e.message}")
        }
      }
      discoveryReceiver = null

      // Close socket
      bluetoothSocket?.close()
      bluetoothSocket = null
    }
  }

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Start device discovery
   */
  private fun startDiscovery(adapter: BluetoothAdapter, promise: Promise) {
    // Unregister existing receiver
    discoveryReceiver?.let {
      try {
        appContext.reactContext?.unregisterReceiver(it)
      } catch (e: Exception) {
        Log.w(TAG, "Failed to unregister receiver: ${e.message}")
      }
    }

    // Register new receiver
    discoveryReceiver = object : BroadcastReceiver() {
      override fun onReceive(context: Context?, intent: Intent?) {
        when (intent?.action) {
          BluetoothDevice.ACTION_FOUND -> {
            val device: BluetoothDevice? = @Suppress("DEPRECATION")
              intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE)
            val rssi = intent.getShortExtra(BluetoothDevice.EXTRA_RSSI, Short.MIN_VALUE).toInt()

            val deviceMap = bundleOf(
              "id" to (device?.address ?: ""),
              "name" to (device?.name ?: "Unknown"),
              "rssi" to rssi
            )
            Log.d(TAG, "Found: ${device?.name} (${device?.address}) RSSI: $rssi")
            sendEvent("onDeviceFound", deviceMap)
          }
          BluetoothAdapter.ACTION_DISCOVERY_FINISHED -> {
            Log.d(TAG, "Discovery finished")
            isDiscovering = false
          }
        }
      }
    }

    val filter = IntentFilter().apply {
      addAction(BluetoothDevice.ACTION_FOUND)
      addAction(BluetoothAdapter.ACTION_DISCOVERY_FINISHED)
    }

    try {
      appContext.reactContext?.registerReceiver(discoveryReceiver, filter)
    } catch (e: Exception) {
      Log.e(TAG, "Failed to register receiver", e)
      promise.reject("RECEIVER_REGISTRATION_FAILED", "Failed to register receiver: ${e.message}", null)
      return
    }

    // Start discovery
    val started = adapter.startDiscovery()
    if (started) {
      isDiscovering = true
      Log.d(TAG, "Discovery started")
      promise.resolve(true)
    } else {
      isDiscovering = false
      promise.reject("DISCOVERY_FAILED", "Failed to start discovery", null)
    }
  }

  /**
   * Get the Bluetooth adapter
   */
  private fun getBluetoothAdapter(): BluetoothAdapter? {
    val bluetoothManager = appContext.reactContext
      ?.getSystemService(Context.BLUETOOTH_SERVICE) as? android.bluetooth.BluetoothManager
    return bluetoothManager?.adapter
  }
}
