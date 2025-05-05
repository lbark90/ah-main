"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "../../lib/context/UserContext";
import { useRouter } from "next/navigation";
import {
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaMicrophone,
  FaImages,
} from "react-icons/fa";
import PhotoGallery from "@/components/PhotoGallery";

export default function Profile() {
  const { user, setUser, logout } = useUser();
  const router = useRouter();
  const [editMode, setEditMode] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState("name");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState({
    loading: false,
    error: null as string | null,
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");

  const [successType, setSuccessType] = useState(""); // "username", "password", or "profile"

  const [editedUser, setEditedUser] = useState<{
    firstName: string;
    middleName: string;
    lastName: string;
    email: string;
    photoUrl: string;
    username: string;
    photos: string[];
    dob: string;
  }>({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    photoUrl: "",
    username: "",
    photos: [],
    dob: "",
  });

  useEffect(() => {
    if (!user) {
      console.warn("No user found. Redirecting to login page.");
      router.push("/login");
      return;
    }

    const fetchLoginCredentials = async () => {
      try {
        const url = `/api/user/login_credentials?userId=${user.id}`;
        console.log("Fetching login credentials from:", url);

        const response = await fetch(url);
        if (!response.ok) {
          if (response.status === 404) {
            console.warn("Login credentials not found for user:", user.id);
            return;
          }
          throw new Error(`Failed to fetch login credentials: ${response.status}`);
        }

        const data = await response.json();
        console.log("Fetched login credentials:", data);

        setEditedUser((prev) => ({
          ...prev,
          firstName: data.firstName || prev.firstName,
          middleName: data.middleName || prev.middleName,
          lastName: data.lastName || prev.lastName,
          email: data.email || prev.email,
          dob: data.dateOfBirth || prev.dob,
          username: data.userId || prev.username,
        }));
      } catch (error) {
        console.error("Error fetching login credentials:", error);
      }
    };

    const fetchPhotos = async () => {
      try {
        if (!user?.id) {
          console.warn("No user ID available");
          return;
        }
        console.log("Fetching photos for user:", user.id);
        const response = await fetch(
          `/api/photos/${encodeURIComponent(user.id)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) {
          console.error("Failed to fetch photos:", response.status);
          throw new Error(`Failed to fetch photos: ${response.status}`);
        }
        const data = await response.json();
        console.log("Received photos data:", data);

        setUploadedPhotos(data.galleryPhotos || []);
        setEditedUser((prev) => ({
          ...prev,
          photoUrl: data.profilePhotos?.[0] || "",
          photos: data.galleryPhotos || [],
        }));
      } catch (error) {
        console.error("Error fetching photos:", error);
        setUploadStatus({ loading: false, error: "Failed to fetch photos" });
      }
    };

    fetchLoginCredentials();
    fetchPhotos();
  }, [user]);

  const getUserFolderName = (): string => {
    if (!user || !user.id) return "anonymous";
    return user.id;
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log(
      "File selected:",
      file.name,
      "Type:",
      file.type,
      "Size:",
      file.size,
    );
    setUploadStatus({ loading: true, error: null });

    try {
      const formData = new FormData();
      formData.append("audio", file);
      formData.append("userName", getUserFolderName());
      formData.append("questionIndex", "0");
      formData.append("type", "profile-photo");

      const response = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });

      console.log("Upload response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error response:", errorText);
        throw new Error(
          `Upload failed with status: ${response.status}. Server response: ${errorText}`,
        );
      }

      const data = await response.json();
      console.log("Upload response data:", data);

      if (data.filePath || data.url) {
        const photoUrl =
          data.url ||
          `https://storage.googleapis.com/memorial-voices/${data.filePath}`;
        console.log("Setting photo URL to:", photoUrl);

        const updatedUser = {
          ...editedUser,
          photoUrl: photoUrl,
        };
        setEditedUser(updatedUser);

        await setUser({
          ...updatedUser,
          phone: user?.phone || "",
          id: user?.id || ""
        });
        setUploadStatus({ loading: false, error: null });
      } else {
        console.error("No file path or URL in response:", data);
        throw new Error(
          "Server responded but no file path or URL was provided",
        );
      }
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      setUploadStatus({
        loading: false,
        error: error.message || "Failed to upload photo",
      });
    }
  };

  // Handle gallery photo upload with multiple files support
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    setUploadStatus({ loading: true, error: null });

    try {
      const uploadedUrls: string[] = [];

      // Upload each file sequentially
      for (const file of files) {
        console.log(
          "Gallery file selected:",
          file.name,
          "Type:",
          file.type,
          "Size:",
          file.size,
        );

        // Create form data matching what the server expects
        const formData = new FormData();
        formData.append("audio", file); // Server expects 'audio' not 'photo'
        formData.append("userName", getUserFolderName());
        formData.append("questionIndex", "0"); // Server requires this field
        formData.append("type", "gallery"); // Use 'gallery' type

        const response = await fetch("/api/storage/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Server error response for gallery:", errorText);
          throw new Error(
            `Gallery upload failed with status: ${response.status}. Server response: ${errorText}`,
          );
        }

        const data = await response.json();
        console.log("Gallery upload response data:", data);

        // Check if we received a filePath or URL
        if (data.filePath || data.url) {
          // Prefer the returned URL if available, otherwise construct one
          const photoUrl =
            data.url ||
            `https://storage.googleapis.com/memorial-voices/${data.filePath}`;
          console.log("Adding gallery photo URL:", photoUrl);

          uploadedUrls.push(photoUrl);
        } else {
          console.error("No file path or URL in gallery response:", data);
          throw new Error(
            "Server responded but no file path or URL was provided for gallery upload",
          );
        }
      }

      // Update states with all new URLs at once
      setUploadedPhotos((prev) => [...prev, ...uploadedUrls]);
      setEditedUser((prev) => ({
        ...prev,
        photos: [...(prev.photos || []), ...uploadedUrls],
      }));

      // Make sure to update the user context as well
      if (setUser && user) {
        await setUser({
          ...user,  // Preserve existing user data
          // Only include properties that exist in UserData type
          id: user.id || "",
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          middleName: user.middleName || "",
          email: user.email || "",
          phone: user.phone || "",
          photoUrl: user.photoUrl || "",
        });
      }

      setUploadStatus({ loading: false, error: null });
    } catch (error: any) {
      console.error("Error uploading gallery photos:", error);
      setUploadStatus({
        loading: false,
        error: error.message || "Failed to upload gallery photos",
      });
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError("");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: user?.id,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update password");
      }

      setShowPasswordModal(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setSaveSuccess(true);
      setSuccessType("password");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setPasswordError(
        error.message || "Failed to update password. Please try again.",
      );
    }
  };

  const handleSave = async () => {
    try {
      await setUser({
        ...editedUser,
        phone: user?.phone || "",
        id: user?.id || ""
      });
      setSaveSuccess(true);
      setSuccessType("profile");
      setEditMode(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {uploadStatus.error && (
        <div className="bg-red-600 text-white px-4 py-2 text-center">
          Upload Error: {uploadStatus.error}
        </div>
      )}
      {uploadStatus.loading && (
        <div className="bg-blue-600 text-white px-4 py-2 text-center">
          Uploading... Please wait.
        </div>
      )}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-4 gap-8">
          <div className="col-span-1">
            <div className="mb-6 flex flex-col items-center">
              <label className="cursor-pointer">
                <div className="w-32 h-32 bg-slate-700 rounded-full overflow-hidden border-4 border-slate-600 mb-4 relative group">
                  {editedUser.photoUrl ? (
                    <img
                      src={editedUser.photoUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaUser className="text-4xl text-slate-500" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white text-sm">Change Photo</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfilePhotoUpload}
                    disabled={uploadStatus.loading}
                  />
                </div>
              </label>
              <span className="text-lg font-medium">
                {user?.firstName}{" "}
                {user?.middleName ? `${user.middleName} ` : ""}
                {user?.lastName}
              </span>
            </div>
            <nav className="space-y-2">
              <button
                onClick={() => setActiveSection("name")}
                className={`w-full text-left px-4 py-2 rounded-md flex items-center gap-2 ${activeSection === "name"
                  ? "bg-blue-500"
                  : "hover:bg-slate-800"
                  }`}
              >
                <FaUser /> Profile
              </button>
              <button
                onClick={() => setActiveSection("gallery")}
                className={`w-full text-left px-4 py-2 rounded-md flex items-center gap-2 ${activeSection === "gallery"
                  ? "bg-blue-500"
                  : "hover:bg-slate-800"
                  }`}
              >
                <FaImages /> Photo Gallery
              </button>
              <Link
                href="/recordings"
                className="w-full text-left px-4 py-2 rounded-md flex items-center gap-2 hover:bg-slate-800"
              >
                <FaMicrophone /> Recordings
              </Link>
              <button
                onClick={() => setActiveSection("settings")}
                className={`w-full text-left px-4 py-2 rounded-md flex items-center gap-2 ${activeSection === "settings"
                  ? "bg-blue-500"
                  : "hover:bg-slate-800"
                  }`}
              >
                <FaCog /> Settings
              </button>
              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="w-full text-left px-4 py-2 rounded-md flex items-center gap-2 text-red-400 hover:bg-slate-800"
              >
                <FaSignOutAlt /> Logout
              </button>
            </nav>
          </div>

          <div className="col-span-3">
            <div className="bg-slate-800/50 p-8 rounded-lg">
              {activeSection === "gallery" && (
                <div className="max-w-2xl mx-auto">
                  {/* Add profile picture upload section at the top */}
                  <div className="mb-8 border-b border-slate-700 pb-8">
                    <h3 className="text-lg font-medium mb-4">Profile Picture</h3>
                    <div className="flex items-center gap-6">
                      <div className="w-32 h-32 rounded-lg overflow-hidden bg-slate-700 border-2 border-slate-600 relative">
                        {editedUser.photoUrl ? (
                          <img
                            src={editedUser.photoUrl}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FaUser className="text-4xl text-slate-500" />
                          </div>
                        )}
                      </div>
                      <label className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 transition-colors text-white">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Update Profile Picture
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleProfilePhotoUpload}
                          disabled={uploadStatus.loading}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Main photo gallery */}
                  <PhotoGallery
                    photos={uploadedPhotos}
                    onUpload={handlePhotoUpload}
                    isUploading={uploadStatus.loading}
                  />

                  {uploadStatus.error && (
                    <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md">
                      {uploadStatus.error}
                    </div>
                  )}
                </div>
              )}

              {activeSection === "name" && (
                <div>
                  <h2 className="text-xl font-light mb-6">
                    Personal Information
                  </h2>
                  <div className="space-y-3">
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={editedUser.firstName}
                        onChange={(e) =>
                          setEditedUser({
                            ...editedUser,
                            firstName: e.target.value,
                          })
                        }
                        disabled={!editMode}
                        className={`w-full px-4 py-2 bg-slate-900/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${editMode ? "text-white" : "text-slate-400"
                          }`}
                      />
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Middle Name
                      </label>
                      <input
                        type="text"
                        value={editedUser.middleName || ""}
                        onChange={(e) =>
                          setEditedUser({
                            ...editedUser,
                            middleName: e.target.value,
                          })
                        }
                        disabled={!editMode}
                        className={`w-full px-4 py-2 bg-slate-900/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${editMode ? "text-white" : "text-slate-400"
                          }`}
                      />
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={editedUser.lastName}
                        onChange={(e) =>
                          setEditedUser({
                            ...editedUser,
                            lastName: e.target.value,
                          })
                        }
                        disabled={!editMode}
                        className={`w-full px-4 py-2 bg-slate-900/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${editMode ? "text-white" : "text-slate-400"
                          }`}
                      />
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={editedUser.dob || ""}
                        onChange={(e) =>
                          setEditedUser({
                            ...editedUser,
                            dob: e.target.value,
                          })
                        }
                        disabled={!editMode}
                        className={`w-full px-4 py-2 bg-slate-900/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${editMode ? "text-white" : "text-slate-400"
                          }`}
                      />
                    </div>
                  </div>
                  {!editMode && (
                    <button
                      onClick={() => setEditMode(true)}
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                      Edit Profile
                    </button>
                  )}
                  {editMode && (
                    <div className="flex gap-4 mt-4">
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => setEditMode(false)}
                        className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeSection === "settings" && (
                <div>
                  <h2 className="text-xl font-light mb-6">Settings</h2>
                  <div className="space-y-8">
                    <div className="bg-slate-800/50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium mb-4">
                        Email Address
                      </h3>
                      <input
                        type="email"
                        value={editedUser.email}
                        onChange={(e) =>
                          setEditedUser({
                            ...editedUser,
                            email: e.target.value,
                          })
                        }
                        disabled={!editMode}
                        className={`w-full px-4 py-2 bg-slate-900/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${editMode ? "text-white" : "text-slate-400"
                          }`}
                      />
                      {!editMode ? (
                        <button
                          onClick={() => setEditMode(true)}
                          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                        >
                          Edit Email
                        </button>
                      ) : (
                        <div className="flex gap-4 mt-4">
                          <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => setEditMode(false)}
                            className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="bg-slate-800/50 p-6 rounded-lg">
                      {saveSuccess && (
                        <div className="mb-4 p-3 bg-green-500/20 text-green-400 rounded-md">
                          {successType === "password" &&
                            "Password updated successfully!"}
                          {successType === "username" &&
                            "Username updated successfully!"}
                          {successType === "profile" &&
                            "Profile updated successfully!"}
                        </div>
                      )}
                      <h3 className="text-lg font-medium mb-4">Username</h3>
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={editedUser.username}
                          onChange={(e) =>
                            setEditedUser({
                              ...editedUser,
                              username: e.target.value,
                            })
                          }
                          disabled={!editMode}
                          className={`w-full px-4 py-2 bg-slate-900/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${editMode ? "text-white" : "text-slate-400"
                            }`}
                          placeholder="Enter new username"
                        />
                        {!editMode ? (
                          <button
                            onClick={() => setEditMode(true)}
                            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                          >
                            Edit Username
                          </button>
                        ) : (
                          <div className="flex gap-4">
                            <button
                              onClick={async () => {
                                try {
                                  if (!editedUser.username) {
                                    alert("Please enter a username");
                                    return;
                                  }
                                  if (editedUser.username === user?.id) {
                                    alert("Please enter a different username");
                                    return;
                                  }
                                  const response = await fetch(
                                    "/api/storage/rename-folder",
                                    {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        oldUsername: user?.id,
                                        newUsername: editedUser.username,
                                      }),
                                    }
                                  );
                                  if (!response.ok) {
                                    throw new Error("Failed to rename folder");
                                  }
                                  const data = await response.json();
                                  if (data.success) {
                                    await setUser({
                                      ...editedUser,
                                      phone: user?.phone || "",
                                      id: editedUser.username,
                                    });
                                    setEditMode(false);
                                    setSaveSuccess(true);
                                    setSuccessType("username");
                                    setTimeout(
                                      () => setSaveSuccess(false),
                                      3000
                                    );
                                  }
                                } catch (error) {
                                  console.error(
                                    "Error updating username:",
                                    error
                                  );
                                  alert(
                                    "Failed to update username. Please try again."
                                  );
                                }
                              }}
                              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex-shrink-0"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditMode(false)}
                              className="px-6 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 transition-colors flex-shrink-0"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-slate-800/50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium mb-4">Password</h3>
                      <p className="text-slate-400 mb-4">
                        Change your account password
                      </p>
                      <button
                        onClick={() => setShowPasswordModal(true)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                      >
                        Change Password
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-slate-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-medium mb-4">Change Password</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-slate-900/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-slate-900/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-slate-900/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {passwordError && (
                <p className="text-red-500 text-sm">{passwordError}</p>
              )}
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}