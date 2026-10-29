import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isEmailTakenError, signUpInstructor, type InstructorSignUpClient } from "../services/instructorSignUp";

const request = {
  email: "sensei@test.local",
  password: "Secret123!",
  full_name: "Sensei",
  organization_name: "Dojo Org",
  school_name: "Dojo Kraków",
};

const session = { access_token: "a", refresh_token: "r" };

/** Fake Supabase client: scripted auth answers, the owned organization, recorded calls. */
function fakeClient(opts: {
  signUp?: { data?: any; error?: any };
  signIn?: { data?: any; error?: any };
  organizationId?: string | null;
  rpc?: { data?: any; error?: any };
}) {
  const calls: { name: string; params?: any }[] = [];
  const client: InstructorSignUpClient = {
    auth: {
      signUp: async (params) => {
        calls.push({ name: "signUp", params });
        return { data: { user: null, session: null }, error: null, ...opts.signUp } as any;
      },
      signInWithPassword: async (params) => {
        calls.push({ name: "signIn", params });
        return { data: { user: null, session: null }, error: null, ...opts.signIn } as any;
      },
      setSession: async () => calls.push({ name: "setSession" }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signOut: async () => calls.push({ name: "signOut" }),
    },
    from: (table) => {
      const query: any = {
        select: () => query,
        eq: () => query,
        is: () => query,
        maybeSingle: async () => {
          calls.push({ name: `from:${table}` });
          return { data: opts.organizationId ? { id: opts.organizationId } : null, error: null };
        },
      };
      return query;
    },
    rpc: async (fn, params) => {
      calls.push({ name: `rpc:${fn}`, params });
      return { data: null, error: null, ...opts.rpc };
    },
  };
  return { client, calls, names: () => calls.map((c) => c.name) };
}

describe("signUpInstructor", () => {
  it("sends the organization in the sign-up metadata and makes no separate setup call", async () => {
    const { client, calls, names } = fakeClient({
      signUp: { data: { user: { id: "u1" }, session } },
      organizationId: "o1",
    });

    assert.deepEqual(await signUpInstructor(client, request), { user_id: "u1", organization_id: "o1" });
    assert.deepEqual(calls[0].params.options.data, {
      full_name: "Sensei",
      organization_name: "Dojo Org",
      school_name: "Dojo Kraków",
    });
    assert.ok(!names().some((n) => n.startsWith("rpc:")));
  });

  it("fails when the account came back without an organization", async () => {
    const { client } = fakeClient({ signUp: { data: { user: { id: "u1" }, session } }, organizationId: null });
    await assert.rejects(signUpInstructor(client, request), /organization_setup_failed/);
  });

  it("completes an existing account left without an organization", async () => {
    const { client, calls, names } = fakeClient({
      signUp: { error: { code: "user_already_exists", message: "User already registered" } },
      signIn: { data: { user: { id: "u2" }, session } },
      organizationId: null,
      rpc: { data: { success: true, organization_id: "o2" } },
    });

    assert.deepEqual(await signUpInstructor(client, request), { user_id: "u2", organization_id: "o2" });
    const setup = calls.find((c) => c.name === "rpc:setup_instructor_organization");
    assert.equal(setup?.params.p_user_id, "u2");
    assert.equal(setup?.params.p_organization_name, "Dojo Org");
    assert.ok(!names().includes("signOut"));
  });

  it("an existing instructor with the right password just gets their organization", async () => {
    const { client, names } = fakeClient({
      signUp: { error: { message: "User already registered" } },
      signIn: { data: { user: { id: "u3" }, session } },
      organizationId: "o3",
    });

    assert.deepEqual(await signUpInstructor(client, request), { user_id: "u3", organization_id: "o3" });
    assert.ok(!names().some((n) => n.startsWith("rpc:")));
  });

  it("a taken e-mail with another password stays 'already registered'", async () => {
    const { client, names } = fakeClient({
      signUp: { error: { code: "user_already_exists", message: "User already registered" } },
      signIn: { error: { message: "Invalid login credentials" } },
    });

    await assert.rejects(signUpInstructor(client, request), /already registered/);
    assert.ok(!names().some((n) => n.startsWith("rpc:")));
  });

  it("signs out again when completing the account fails", async () => {
    const { client, names } = fakeClient({
      signUp: { error: { code: "user_already_exists", message: "User already registered" } },
      signIn: { data: { user: { id: "u4" }, session } },
      organizationId: null,
      rpc: { error: { message: "Failed to setup organization" } },
    });

    await assert.rejects(signUpInstructor(client, request), /Failed to setup organization/);
    assert.ok(names().includes("signOut"));
  });
});

describe("isEmailTakenError", () => {
  it("recognizes Supabase's codes and messages", () => {
    assert.equal(isEmailTakenError({ code: "user_already_exists" }), true);
    assert.equal(isEmailTakenError({ code: "email_exists" }), true);
    assert.equal(isEmailTakenError({ message: "User already registered" }), true);
    assert.equal(isEmailTakenError({ message: "Password should be at least 6 characters" }), false);
    assert.equal(isEmailTakenError(null), false);
  });
});
