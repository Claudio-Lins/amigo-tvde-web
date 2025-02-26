interface AuthError {
	code: string;
	message: string;
	title?: string;
	description?: string;
	action?: {
		label: string;
		route: string;
	};
}

const authErrors: Record<string, AuthError> = {
	not_found_error: {
		code: "not_found_error",
		message: "User not found.",
		title: "Account not found",
		description: "Do you want to create a new account?",
		action: {
			label: "Create account",
			route: "/auth/sign-up",
		},
	},
	rate_limit_error: {
		code: "rate_limit_error",
		message: "Too many attempts. Please wait a few minutes.",
		title: "Limit exceeded",
	},
	network_connection_error: {
		code: "network_connection_error",
		message: "Connection error. Check your internet.",
		title: "Connection error",
	},
	invalid_email_address: {
		code: "invalid_email_address",
		message: "Enter a valid email (e.g., user@example.com).",
		title: "Invalid email",
	},
	email_already_exists: {
		code: "email_already_exists",
		message: "An account with this email already exists. Log in.",
		title: "Email already registered",
		action: {
			label: "Log in",
			route: "/auth/sign-in",
		},
	},
	invalid_authentication: {
		code: "invalid_authentication",
		message: "Invalid credentials. Check your email and password.",
		title: "Authentication error",
	},
	password_incorrect: {
		code: "password_incorrect",
		message: "Incorrect password. Try again.",
		title: "Incorrect password",
		description: "Forgot your password?",
		action: {
			label: "Reset password",
			route: "/auth/reset-password",
		},
	},
	password_too_short: {
		code: "password_too_short",
		message: "Password must be at least 8 characters.",
		title: "Password too short",
	},
	password_too_weak: {
		code: "password_too_weak",
		message: "Password too weak. Use letters, numbers, and special characters.",
		title: "Weak password",
	},
	password_no_number: {
		code: "password_no_number",
		message: "Password must contain at least one number.",
		title: "Password no number",
	},
	password_no_letter: {
		code: "password_no_letter",
		message: "Password must contain at least one letter.",
		title: "Password no letter",
	},
	blocked_user: {
		code: "blocked_user",
		message: "This account has been blocked. Contact support.",
		title: "Blocked account",
	},
	blocked_status: {
		code: "blocked_status",
		message: "Your account has been suspended. Contact our support team.",
		title: "Suspended account",
	},
	// Password reset errors
	reset_password_error: {
		code: "reset_password_error",
		message: "Failed to send password reset email.",
		title: "Failed to send password reset email",
	},
	unprocessable_content: {
		code: "unprocessable_content",
		message: "Email not found or invalid.",
		title: "Invalid email",
	},
	invalid_reset_code: {
		code: "invalid_reset_code",
		message: "Invalid or expired verification code.",
		title: "Invalid verification code",
	},
};

export function getAuthErrorMessage(error: any): AuthError {
	// Checks for blocked status
	if (error?.statusClientLabel === "Blocked") {
		return authErrors.blocked_status;
	}

	// Checks if it's a Clerk error
	if (error?.errors?.[0]?.code) {
		const errorCode = error.errors[0].code;
		if (errorCode === "user_blocked" || errorCode === "blocked_user") {
			return authErrors.blocked_user;
		}
		return (
			authErrors[errorCode] || {
				code: "unknown",
				message: "Authentication error.",
				title: "Error",
			}
		);
	}

	// Checks common error messages
	const errorMessage = error?.message?.toLowerCase() || "";

	// Checks for blocked user
	if (errorMessage.includes("blocked") || errorMessage.includes("suspended")) {
		return authErrors.blocked_status;
	}

	// Email related errors
	if (errorMessage.includes("email")) {
		if (errorMessage.includes("invalid") || !errorMessage.includes("@")) {
			return authErrors.invalid_email_address;
		}
		if (errorMessage.includes("exists") || errorMessage.includes("already")) {
			return authErrors.email_already_exists;
		}
	}

	// Password errors
	if (errorMessage.includes("password")) {
		if (errorMessage.includes("incorrect") || errorMessage.includes("wrong")) {
			return authErrors.password_incorrect;
		}
		if (errorMessage.includes("too short")) {
			return authErrors.password_too_short;
		}
		if (errorMessage.includes("weak")) {
			return authErrors.password_too_weak;
		}
		if (errorMessage.includes("number")) {
			return authErrors.password_no_number;
		}
		if (errorMessage.includes("letter")) {
			return authErrors.password_no_letter;
		}
	}

	// Checks HTTP errors
	if (error?.status === 422 || error?.statusCode === 422) {
		return authErrors.unprocessable_content;
	}

	return {
		code: "unknown",
		message: "An unexpected error occurred. Try again or contact support.",
		title: "Error",
	};
}
