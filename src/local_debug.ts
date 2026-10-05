export function isLocalDebugEnabled(args: readonly string[]): boolean {
  return args.includes("-debug") || args.includes("--debug");
}
