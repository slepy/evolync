/** Minimal typing for the untyped react-test-renderer devDependency (tests only). */
declare module "react-test-renderer" {
  import type { ReactElement } from "react";
  export interface ReactTestRendererJSON {
    type: string;
    props: Record<string, any>;
    children: Array<ReactTestRendererJSON | string> | null;
  }
  export interface ReactTestRenderer {
    unmount(): void;
    update(element: ReactElement): void;
    toJSON(): ReactTestRendererJSON | ReactTestRendererJSON[] | null;
  }
  const TestRenderer: { create(element: ReactElement): ReactTestRenderer };
  export default TestRenderer;
}
