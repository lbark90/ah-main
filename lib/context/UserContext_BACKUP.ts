export async function loginUser(username: string, password: string) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error('Invalid username or password');
    }

    const data = await response.json();
    // Save user data to context or localStorage
    localStorage.setItem('aliveHereUser', JSON.stringify(data.user));
    setUser(data.user);
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}
function setUser(user: any) {
  throw new Error("Function not implemented.");
}

