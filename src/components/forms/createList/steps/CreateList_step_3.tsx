import FormRenderer from "../../../FormRenderer";
import { getListExitStrategySchema } from "../../../../schemas/create-list/schema_step_3";
import useAppStore from "../../../../store/useAppStore";

const CreateList_step_3 = ({
  onPrevious,
  onConfirm,
}: {
  onPrevious: () => void;
  onConfirm: (data: any) => {};
}) => {
  const settings = useAppStore((state) => state.settings);
  const { callResults } = settings!["Phone Settings"];

  function transformToSnakeCase(str: string) {
    return str.trim().toLowerCase().replace(/\s+/g, "_");
  }

  const extendedCallResults = callResults.map((callResult: any) => {
    return { ...callResult, value: transformToSnakeCase(callResult.label) };
  });

  const listExitStrategySchema = getListExitStrategySchema(extendedCallResults);

  return (
    <FormRenderer
      schema={listExitStrategySchema}
      onPrevious={onPrevious}
      onSubmit={onConfirm}
    />
  );
};

export default CreateList_step_3;
