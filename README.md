# RxJS FlexMap Operator
_by David Björkevik_

An RxJS operator using a single callback function that can cover
the functionality of the map and filter operators as well as a few
other cases.

To control behavior a handler function is passed to the operator. This
handler function will be called once for each incoming value. It will be
passed two parameters, the first being the incoming value and the second is
a "yield function" that is used to pass values downstream.
The yield function may be called an arbitrary number of times or not at all,
and even after the handler function returns.

Any exception thrown by the handler function will be passed on as an error
down the pipe.  Also, if the handler returns a promise, in case of rejection
of this promise, the error state is passed down the pipe. This allows
for async handler functions.

Also, if the upstream completes, any outstanding promise must be
resolved before the completion event is continued downstream.

Any error state from upstream is passed along by this operator

## Installation
```shell script
npm install rxjs-flexmap
```

## Example usage

### Map-like behavior
```typescript

import { of } from "rxjs";
import { flexMap } from "flexmap";

// ...

of(1, 2, 3, 4)
  .pipe(
    flexMap<number, number>((v: number, yld) => yld(v * 2))
  )
  .subscribe(v => console.log(v));
```
The above code will output
```
2
4
6
8
```

### Filter-like behavior
```typescript

import { of } from "rxjs";
import { flexMap } from "rxjs-flexmap";

// ...

of(1, 2, 3, 4)
  .pipe(
    flexMap<number, number>((v: number, yld) => v % 2 && yld(v))
  )
  .subscribe(v => console.log(v));
```
The above code will output
```
1
3
```

### Duplicate every value
```typescript

import { of } from "rxjs";
import { flexMap } from "rxjs-flexmap";

// ...

of(1, 2, 3)
  .pipe(
    flexMap<number, number>((v, yld) => { yld(v); yld(v); })
  )
  .subscribe(v => console.log(v));
```
The above code will output
```
1
1
2
2
3
3
```
