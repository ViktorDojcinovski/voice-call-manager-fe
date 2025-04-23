import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import FormRenderer from "../FormRenderer";
import { powerDialerManagementSchema } from "../../schemas/phone-settings/power-dialer-management/schema";
import { powerDialerManagementValidationSchema } from "../../schemas/phone-settings/power-dialer-management/validation-schema";
import api from "../../utils/axiosInstance";
import useAppStore from "../../store/useAppStore";

const PowerDialerManagementFormComponent = (data: any) => {
  const { telephonyConnection, powerDialer } = data;
  const user = useAppStore((state) => state.user);
  const settings = useAppStore((state) => state.settings);
  const setSettings = useAppStore((state) => state.setSettings);

  const methods = useForm({
    defaultValues: {
      telephonyConnection,
      powerDialer,
    },
    resolver: zodResolver(powerDialerManagementValidationSchema),
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
          powerDialerManagement: { ...formData },
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
        schema={powerDialerManagementSchema}
        onSubmit={(formData) => onSubmit(formData)}
      />
    </FormProvider>
  );
};

export default PowerDialerManagementFormComponent;
