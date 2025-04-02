import FormRenderer from "../FormRenderer";
import { recordingsManagementSchema } from "../../schemas/phone-settings/call-recordings/schema";
import { recordingsManagementValidationSchema } from "../../schemas/phone-settings/call-recordings/validation-schema";
import api from "../../utils/axiosInstance";
import useAppStore from "../../store/useAppStore";

const CallManagementFormComponent = (data: any) => {
  const {
    enableCallRecording,
    excludePhonesStartingWith,
    includeOnlyPhonesStartingWith,
  } = data;
  const user = useAppStore((state) => state.user);
  const settings = useAppStore((state) => state.settings);
  const setSettings = useAppStore((state) => state.setSettings);

  const defaultValues = {
    enableCallRecording,
    excludePhonesStartingWith,
    includeOnlyPhonesStartingWith,
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
          recordingsManagement: { ...formData },
        },
      });
      setSettings(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <FormRenderer
      schema={recordingsManagementSchema}
      defaultValues={defaultValues}
      onSubmit={(formData) => onSubmit(formData)}
      validationSchema={recordingsManagementValidationSchema}
    />
  );
};

export default CallManagementFormComponent;
