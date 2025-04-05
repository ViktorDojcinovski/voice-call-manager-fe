import FormRenderer from "../FormRenderer";
import { callManagementSchema } from "../../schemas/phone-settings/call-management/schema";
import { callManagementValidationSchema } from "../../schemas/phone-settings/call-management/validation-schema";
import api from "../../utils/axiosInstance";
import useAppStore from "../../store/useAppStore";

const CallManagementFormComponent = (data: any) => {
  const { connectionDefinition, preventMultiple } = data;
  const user = useAppStore((state) => state.user);
  const settings = useAppStore((state) => state.settings);
  const setSettings = useAppStore((state) => state.setSettings);

  const defaultValues = {
    connectionDefinition,
    preventMultiple,
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
          callManagement: { ...formData },
        },
      });
      setSettings(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <FormRenderer
      schema={callManagementSchema}
      defaultValues={defaultValues}
      onSubmit={(formData) => onSubmit(formData)}
      validationSchema={callManagementValidationSchema}
    />
  );
};

export default CallManagementFormComponent;
