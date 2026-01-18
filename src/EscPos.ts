/**
 * ESC/POS Commands for Thermal Printers
 * @see https://reference.epson-biz.com/modules/ref_escpos/index.html
 */

// ============================================================================
// INTERNAL UTILITIES
// ============================================================================

/** Convert array of numbers to base64 string */
function toBase64(bytes: number[]): string {
  const binaryString = String.fromCharCode(...bytes);
  return btoa(binaryString);
}

/** Helper to create a command from byte values */
function cmd(...bytes: number[]): string {
  return toBase64(bytes);
}

// ============================================================================
// BASIC CONTROL COMMANDS
// ============================================================================

/** ESC @ - Initialize printer */
export const INIT = cmd(0x1b, 0x40);

/** LF - Print and line feed */
export const LF = cmd(0x0a);

/** FF - Form feed (eject paper) */
export const FF = cmd(0x0c);

// ============================================================================
// TEXT FORMATTING
// ============================================================================

/** Text alignment constants */
export enum Align {
  LEFT = 0,
  CENTER = 1,
  RIGHT = 2,
}

/** ESC a n - Set text alignment */
export function setAlign(align: Align): string {
  return cmd(0x1b, 0x61, align);
}

/** Text size constants */
export enum TextSize {
  NORMAL = 0,
  DOUBLE_HEIGHT = 1,
  DOUBLE_WIDTH = 2,
  DOUBLE_BOTH = 3,
}

/** GS ! n - Set text size */
export function setTextSize(size: TextSize): string {
  const sizeMap: Record<TextSize, number> = {
    [TextSize.NORMAL]: 0x00,
    [TextSize.DOUBLE_HEIGHT]: 0x01,
    [TextSize.DOUBLE_WIDTH]: 0x10,
    [TextSize.DOUBLE_BOTH]: 0x11,
  };
  return cmd(0x1d, 0x21, sizeMap[size]);
}

/** ESC E n - Bold on/off */
export const BOLD_ON = cmd(0x1b, 0x45, 1);
export const BOLD_OFF = cmd(0x1b, 0x45, 0);

/** ESC V n - Reverse mode on/off */
export const REVERSE_ON = cmd(0x1b, 0x56, 1);
export const REVERSE_OFF = cmd(0x1b, 0x56, 0);

/** ESC - n - Underline (1=single, 2=double) */
export const UNDERLINE_ON = cmd(0x1b, 0x2d, 1);
export const UNDERLINE_DOUBLE = cmd(0x1b, 0x2d, 2);
export const UNDERLINE_OFF = cmd(0x1b, 0x2d, 0);

// ============================================================================
// CUT COMMANDS
// ============================================================================

/** Cut type */
export enum CutType {
  FULL = 0,
  PARTIAL = 1,
}

/** GS V m - Cut paper */
export function cut(cutType: CutType = CutType.PARTIAL): string {
  return cmd(0x1d, 0x56, cutType);
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/** Combine multiple commands into a single base64 string */
export function combineCommands(...commands: string[]): string {
  const allBytes: number[] = [];
  for (const command of commands) {
    const binary = atob(command);
    for (let i = 0; i < binary.length; i++) {
      allBytes.push(binary.charCodeAt(i));
    }
  }
  return toBase64(allBytes);
}

/** Create a text print command with UTF-8 encoding */
export function text(data: string): string {
  const encoder = new TextEncoder();
  const bytes = Array.from(encoder.encode(data));
  return cmd(...bytes);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/** Paper size constants (58mm) */
export const PAPER_58MM = {
  width: 384, // dots
  charPerLine: 32, // characters
};

/** Print text aligned left */
export function textLeft(str: string): string {
  return combineCommands(setAlign(Align.LEFT), text(str));
}

/** Print text aligned center */
export function textCenter(str: string): string {
  return combineCommands(setAlign(Align.CENTER), text(str));
}

/** Print text aligned right */
export function textRight(str: string): string {
  return combineCommands(setAlign(Align.RIGHT), text(str));
}

/** Print new lines */
export function newLine(count: number = 1): string {
  const lines: string[] = [];
  for (let i = 0; i < count; i++) {
    lines.push(LF);
  }
  return combineCommands(...lines);
}

/**
 * Print horizontal line for 58mm paper (32 chars)
 */
export function horizontalLine(
  style: "normal" | "dashed" | "double" | "hash" = "normal",
): string {
  const chars = PAPER_58MM.charPerLine;
  const lineStyles = {
    dashed: Array.from({ length: chars / 2 }, () => "- ")
      .join("")
      .trimEnd(),
    double: "=".repeat(chars),
    hash: "#".repeat(chars),
    normal: "-".repeat(chars),
  };
  return text(lineStyles[style] + "\n");
}

/**
 * Print a line item
 * Format:
 * Product Name
 * qty x price        subtotal
 */
export function printLineItem(
  name: string,
  quantity: number,
  price: number,
  total: number,
): string {
  const leftPart = `${quantity} x ${price.toFixed(2)}`;
  const rightPart = `${total.toFixed(2)}`;
  const totalWidth = 32;

  const spaces = Math.max(
    1,
    totalWidth - leftPart.length - rightPart.length - 2,
  );
  const paddedSpaces = " ".repeat(spaces);

  return combineCommands(
    text(`${name}\n`),
    text(`${leftPart}${paddedSpaces}${rightPart}\n`),
  );
}

// ============================================================================
// QR CODE
// ============================================================================

/**
 * Print QR Code sized for the paper
 * @param data - The string to encode
 * @param size - Module size (1-16).
 *               For 58mm (384 dots), 8-10 is "large".
 *               For 80mm (512 dots), 12-14 is "large".
 */
export function printQRCode(data: string, size: number = 8): string {
  const encoder = new TextEncoder();
  const dataBytes = Array.from(encoder.encode(data));

  const storeLen = dataBytes.length + 3;
  const pL = storeLen % 256;
  const pH = Math.floor(storeLen / 256);

  return combineCommands(
    setAlign(Align.CENTER), // Center it to make it look "full"
    // 1. Set Model 2
    cmd(0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00),
    // 2. Set Module Size (The 'size' param controls the width)
    cmd(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, size),
    // 3. Set Error Correction Level L
    cmd(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x30),
    // 4. Store Data
    cmd(0x1d, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30, ...dataBytes),
    // 5. Print QR
    cmd(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30),
  );
}
