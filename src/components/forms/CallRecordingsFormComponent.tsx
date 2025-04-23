import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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

  const methods = useForm({
    defaultValues: {
      enableCallRecording,
      excludePhonesStartingWith,
      includeOnlyPhonesStartingWith,
    },
    resolver: zodResolver(recordingsManagementValidationSchema),
  });

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
    <FormProvider {...methods}>
      <FormRenderer
        schema={recordingsManagementSchema}
        onSubmit={(formData) => onSubmit(formData)}
      />
    </FormProvider>
  );
};

export default CallManagementFormComponent;
