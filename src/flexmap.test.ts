import { of, Subject } from "rxjs";
import { flexMap } from "./flexmap";

test("simple map functionality", async () => {
  const result: number[] = [];
  await of(1, 2, 3, 4)
    .pipe(
      flexMap<number, number>((v: number, yld) => yld(v * 2))
    )
    .forEach((v) => result.push(v));
  expect(result).toEqual([2, 4, 6, 8]);
});

test("simple filter functionality", async () => {
  const result: number[] = [];
  await of(1, 2, 3, 4)
    .pipe(flexMap<number, number>((v: number, yld) => v % 2 && yld(v)))
    .forEach((v) => result.push(v));
  expect(result).toEqual([1, 3]);
});

test("double emit functionality", async () => {
  const result: number[] = [];
  await of(1, 2, 3)
    .pipe(
      flexMap<number, number>((v: number, yld) => {
        yld(v);
        yld(-v);
      })
    )
    .forEach((v) => result.push(v));
  expect(result).toEqual([1, -1, 2, -2, 3, -3]);
});

test("throwing handler", () => {
  const result: number[] = [];
  const promise = of(1, 2, 3)
    .pipe(
      flexMap<number, number>(() => {
        throw new Error("DWEB!");
      })
    )
    .forEach((v) => result.push(v));
  return expect(promise).rejects.toThrow("DWEB!");
});

test("async handler", async () => {
  const result: number[] = [];
  await of(1, 2, 3)
    .pipe(
      flexMap<number, number>(async (v: number, yld) => {
        yld(v * 2);
      })
    )
    .forEach((v) => result.push(v));
  expect(result).toEqual([2, 4, 6]);
});

test("handler with rejecting promise", () => {
  const result: number[] = [];
  const promise = of(1, 2, 3)
    .pipe(
      flexMap<number, number>(() => Promise.reject(Error("DWEB!")))
    )
    .forEach((v) => result.push(v));
  return expect(promise).rejects.toThrow("DWEB!");
});

test("Await final yield", () => {
  const sender = new Subject<number>();
  let innerYield!: (x: number) => void;
  let innerResolve!: () => void;
  const result: number[] = [];
  const promise = sender
    .pipe(
      flexMap<number, number>((v: number, yld) => {
        innerYield = yld;
        return new Promise((resolve) => {
          innerResolve = resolve;
        });
      })
    )
    .forEach((v) => result.push(v));
  sender.next(3);
  sender.complete();

  innerYield(8);
  innerResolve();
  return expect(promise.then(() => result)).resolves.toEqual([8]);
});

test("Error propagation", () => {
  const sender = new Subject<number>();
  const result = [];
  const promise = sender
    .pipe(
      flexMap<number, number>((v: number, yld) => yld(v))
    )
    .forEach((v) => result.push(v));
  sender.error(new Error("DWEB!"));
  return expect(promise).rejects.toThrow("DWEB!");
});
