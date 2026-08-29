export function isAdminUser(user) {
  return Boolean(
    user
    && (
      user.is_superuser
      || user.role === "ADMIN"
    )
  );
}


export function isEmployeeUser(user) {
  return Boolean(
    user
    && user.role === "EMPLOYEE"
  );
}


export function isClientUser(user) {
  return Boolean(
    user
    && user.role === "CLIENT"
  );
}


export function getHomePathForUser(user) {
  if (!user) {
    return "/login";
  }

  if (isAdminUser(user)) {
    return "/admin";
  }

  if (isEmployeeUser(user)) {
    return "/employee";
  }

  if (isClientUser(user)) {
    return "/client";
  }

  return "/";
}