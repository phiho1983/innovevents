import {
  describe,
  expect,
  it,
} from "vitest";

import {
  getHomePathForUser,
  isAdminUser,
  isClientUser,
  isEmployeeUser,
} from "./roleAccess";


describe("RBAC frontend", () => {
  it("reconnait un ADMIN par son role", () => {
    const user = {
      role: "ADMIN",
      is_staff: false,
      is_superuser: false,
    };

    expect(
      isAdminUser(user)
    ).toBe(true);

    expect(
      getHomePathForUser(user)
    ).toBe("/admin");
  });

  it("redirige un EMPLOYEE vers son espace", () => {
    const user = {
      role: "EMPLOYEE",
      is_staff: false,
      is_superuser: false,
    };

    expect(
      isEmployeeUser(user)
    ).toBe(true);

    expect(
      getHomePathForUser(user)
    ).toBe("/employee");
  });

  it("redirige un CLIENT vers son espace", () => {
    const user = {
      role: "CLIENT",
      is_staff: false,
      is_superuser: false,
    };

    expect(
      isClientUser(user)
    ).toBe(true);

    expect(
      getHomePathForUser(user)
    ).toBe("/client");
  });

  it("considere un superuser comme administrateur", () => {
    const user = {
      role: "CLIENT",
      is_staff: false,
      is_superuser: true,
    };

    expect(
      isAdminUser(user)
    ).toBe(true);

    expect(
      getHomePathForUser(user)
    ).toBe("/admin");
  });

  it("redirige un utilisateur non connecte vers login", () => {
    expect(
      getHomePathForUser(null)
    ).toBe("/login");
  });

  it("ne donne pas les droits ADMIN a un EMPLOYEE meme si is_staff vaut true", () => {
    const user = {
      role: "EMPLOYEE",
      is_staff: true,
      is_superuser: false,
    };

    expect(
      isEmployeeUser(user)
    ).toBe(true);

    expect(
      isAdminUser(user)
    ).toBe(false);

    expect(
      getHomePathForUser(user)
    ).toBe("/employee");
  });
});