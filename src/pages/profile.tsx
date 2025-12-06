import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { addToast } from "@heroui/toast";

import { Sidebar } from "@/components/sidebar";
import { userService } from "@/services/user.service";
import { useAuth } from "@/contexts/auth.context";
import type { User } from "@/types/api.types";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user: authUser, refreshUser } = useAuth();
  const [user, setUserState] = useState<User | null>(authUser || null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Form states
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const response = await userService.getProfile();
        setUserState(response.user);
      } catch (error) {
        addToast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to load profile. Please try again.",
          color: "danger",
          severity: "danger",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleNewChat = () => {
    navigate("/");
  };

  const handleChatSelect = (chatId: string) => {
    navigate(`/chats/${chatId}`);
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      addToast({
        title: "Error",
        description: "All password fields are required.",
        color: "danger",
        severity: "danger",
      });

      return;
    }

    if (newPassword !== confirmPassword) {
      addToast({
        title: "Error",
        description: "New passwords do not match.",
        color: "danger",
        severity: "danger",
      });

      return;
    }

    if (newPassword.length < 6) {
      addToast({
        title: "Error",
        description: "Password must be at least 6 characters.",
        color: "danger",
        severity: "danger",
      });

      return;
    }

    try {
      setIsChangingPassword(true);
      await userService.changePassword({
        oldPassword,
        newPassword,
      });
      addToast({
        title: "Success",
        description: "Password changed successfully.",
        color: "success",
        severity: "success",
      });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      addToast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to change password. Please try again.",
        color: "danger",
        severity: "danger",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full bg-white dark:bg-gray-950">
        <Sidebar onChatSelect={handleChatSelect} onNewChat={handleNewChat} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-900 dark:border-gray-100 border-r-transparent"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Loading profile...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-950">
      <Sidebar onChatSelect={handleChatSelect} onNewChat={handleNewChat} />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="flex-1 p-6 md:p-8 lg:p-12">
          <div className="max-w-3xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Profile Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your account information and security
              </p>
            </div>

            <div className="space-y-6">
              {/* Profile Information Card */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                    <span className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
                      {user?.username?.charAt(0).toUpperCase() ||
                        user?.email?.charAt(0).toUpperCase() ||
                        "U"}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {user?.username || "User"}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Account Information
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <Input
                      isReadOnly
                      classNames={{
                        base: "w-full",
                        inputWrapper:
                          "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                        input: "text-gray-900 dark:text-gray-100",
                      }}
                      value={user?.email || ""}
                      variant="bordered"
                    />
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Your email address cannot be changed
                    </p>
                  </div>
                </div>
              </div>

              {/* Change Password Card */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Change Password
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Update your password to keep your account secure
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Password
                    </label>
                    <Input
                      classNames={{
                        base: "w-full",
                        inputWrapper:
                          "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
                      }}
                      placeholder="Enter your current password"
                      type="password"
                      value={oldPassword}
                      variant="bordered"
                      onChange={(e) => setOldPassword(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Password
                    </label>
                    <Input
                      classNames={{
                        base: "w-full",
                        inputWrapper:
                          "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
                      }}
                      placeholder="Enter your new password"
                      type="password"
                      value={newPassword}
                      variant="bordered"
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Must be at least 6 characters long
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <Input
                      classNames={{
                        base: "w-full",
                        inputWrapper:
                          "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
                      }}
                      placeholder="Confirm your new password"
                      type="password"
                      value={confirmPassword}
                      variant="bordered"
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-medium min-w-32"
                      isDisabled={
                        isChangingPassword ||
                        !oldPassword ||
                        !newPassword ||
                        !confirmPassword
                      }
                      isLoading={isChangingPassword}
                      onPress={handleChangePassword}
                    >
                      Update Password
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

