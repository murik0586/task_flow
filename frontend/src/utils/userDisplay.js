export const getUserDisplayName = (user) => {
  if (!user) {
    return 'пользователь';
  }

  if (user.first_name?.trim()) {
    return user.first_name.trim();
  }

  if (user.email) {
    return user.email.split('@')[0];
  }

  return 'пользователь';
};
