export enum TelephonyConnection {
  SOFT_CALL = "Soft call",
  PARALLEL_CALL = "Two Parallel calls",
  ADVANCED_PARALLEL_CALL = "Four Parallel calls",
}

export const connectionDisplayMap: { [key: string]: string } = {
  [TelephonyConnection.SOFT_CALL]: "x1",
  [TelephonyConnection.PARALLEL_CALL]: "x2",
  [TelephonyConnection.ADVANCED_PARALLEL_CALL]: "x4",
};
