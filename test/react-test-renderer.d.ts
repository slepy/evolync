/** Minimal typing for the untyped react-test-renderer devDependency (tests only). */
declare module "react-test-renderer" {
  import type { ReactElement } from "react";
  export interface ReactTestRenderer {
    unmount(): void;
  }
  const TestRenderer: { create(element: ReactElement): ReactTestRenderer };
  export default TestRenderer;
}
