
/**
 * Browser Print Utility
 * Native window.print() is now used for high-quality A4 document generation.
 */
export const exportToPDF = async (_elementId: string, _fileName: string) => {
  window.print();
};
