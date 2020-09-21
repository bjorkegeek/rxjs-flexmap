import { Observable, OperatorFunction } from "rxjs";

/**
 * An RxJS operator using a single callback function that can cover
 * the functionality of the map and filter operators as well as a few
 * other cases.
 *
 * To control behavior a handler function is passed to the operator. This
 * handler function will be called once for each incoming value. It will be
 * passed two parameters, the first being the incoming value and the second is
 * a "yield function" that is used to pass values downstream.
 * The yield function may be called an arbitrary number of times or not at all,
 * and even after the handler function returns.
 *
 * Any exception thrown by the handler function will be passed on as an error
 * down the pipe.  Also, if the handler returns a promise, in case of rejection
 * of this promise, the error state is passed down the pipe. This allows
 * for async handler functions.
 *
 * Also, if the upstream completes, any outstanding promise must be
 * resolved before the completion event is continued downstream.
 *
 * Any error state from upstream is passed along by this operator
 *
 * @param handler The handler function
 */
export function flexMap<T, R>(
  handler: FlexMapHandlerFunction<T, R>
): OperatorFunction<T, R> {
  return (upstream: Observable<T>) =>
    new Observable<R>((subscriber) => {
      const unresolvedPromises: Promise<unknown>[] = [];
      const subscription = upstream.subscribe({
        next(v: T) {
          try {
            const returnValue = handler(v, yieldFn);
            if (isPromise(returnValue)) {
              unresolvedPromises.push(returnValue);
              returnValue
                .catch((e) => subscriber.error(e))
                .then(() => {
                  unresolvedPromises.splice(
                    unresolvedPromises.indexOf(returnValue),
                    1
                  );
                });
            }
          } catch (e) {
            subscriber.error(e);
          }
        },
        error: (err) => subscriber.error(err),
        complete: () => {
          Promise.all(unresolvedPromises)
            .catch((e) => subscriber.error(e))
            .then(() => subscriber.complete());
        },
      });
      subscriber.add(subscription);

      function yieldFn(yieldValue: R) {
        subscriber.next(yieldValue);
      }
    });
}

export type FlexMapHandlerFunction<T, R> = (
  item: T,
  yieldFn: (item: R) => void
) => unknown | Promise<unknown>;

function isPromise(candidate: unknown): candidate is Promise<unknown> {
  return (
    typeof candidate === "object" &&
    candidate !== null &&
    typeof (candidate as Promise<unknown>).then === "function" &&
    typeof (candidate as Promise<unknown>).catch === "function"
  );
}
