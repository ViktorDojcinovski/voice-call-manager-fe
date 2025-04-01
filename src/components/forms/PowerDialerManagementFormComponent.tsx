import FormRenderer from "../FormRenderer";
import { powerDialerManagementSchema } from "../../schemas/phone-settings/power-dialer-management/schema";
import { powerDialerManagementValidationSchema } from "../../schemas/phone-settings/power-dialer-management/validation-schema";
import api from "../../utils/axiosInstance";
import useAppStore from "../../store/useAppStore";

const PowerDialerManagementFormComponent = (data: any) => {
  const { telephonyConnection, powerDialer, identification } = data;
  const user = useAppStore((state) => state.user);
  const settings = useAppStore((state) => state.settings);
  const setSettings = useAppStore((state) => state.setSettings);

  const defaultValues = {
    telephonyConnection,
    powerDialer,
    identification,
  };

  const onSubmit = async (formData: any) => {
    try {
      if (!settings) {
        throw new Error("Missing settings!");
      }
      const existingPhoneSettings = { ...settings["Phone Settings"] };
      const { data } = await api.patch(`/settings/${user!.id}`, {
        "Phone Settings": {
          ...existingPhoneSettings,
          powerDialerManagement: { ...formData },
        },
      });
      setSettings(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <FormRenderer
      schema={powerDialerManagementSchema}
      defaultValues={defaultValues}
      onSubmit={(formData) => onSubmit(formData)}
      validationSchema={powerDialerManagementValidationSchema}
    />
  );
};

export default PowerDialerManagementFormComponent;
