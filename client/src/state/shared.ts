import { useCallback, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import { debugLog } from "@/lib/debug-log";

export type AsyncState<T> = {
  loading: boolean;
  data?: T;
  error?: string;
};

export const initialAsyncState = <T,>(): AsyncState<T> => ({ loading: false });

type RunActionOptions = {
  actionName: string;
  successMessage?: string;
};

export function useAsyncAction(scope: string) {
  const runAction = useCallback(
    async function runAction<T>(
      setState: Dispatch<SetStateAction<AsyncState<T>>>,
      action: () => Promise<T>,
      options: RunActionOptions,
    ) {
      debugLog.info(scope, `${options.actionName}:start`);
      setState((current) => ({
        loading: true,
        data: current.data,
        error: undefined,
      }));

      try {
        const data = await action();
        debugLog.info(scope, `${options.actionName}:success`, data);
        setState({ loading: false, data });

        if (options.successMessage) {
          toast.success(options.successMessage);
        }

        return data;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        debugLog.error(scope, `${options.actionName}:error`, { message, error });
        setState((current) => ({
          loading: false,
          data: current.data,
          error: message,
        }));
        toast.error(message);
        return undefined;
      }
    },
    [scope],
  );

  return { runAction };
}
