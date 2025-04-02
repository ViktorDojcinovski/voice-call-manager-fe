import React from "react";

interface SettingsTypeWrapperProps {
  settingsName: string;
  data: any;
  Component: React.ComponentType<any>;
}

const SettingsTypeWrapper = ({ data, Component }: SettingsTypeWrapperProps) => {
  return <Component {...data} />;
};

export default SettingsTypeWrapper;
