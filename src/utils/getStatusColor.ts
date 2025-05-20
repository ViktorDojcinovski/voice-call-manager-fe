const getStatusColor = (status: string) => {
  switch (status) {
    case "Active":
      return "success";
    case "Paused":
      return "warning";
    case "Draft":
      return "default";
    default:
      return "info";
  }
};

export { getStatusColor };
