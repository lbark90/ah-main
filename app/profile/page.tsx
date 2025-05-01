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

export default function Profile() {
  const { user, setUser, logout } = useUser();
  const router = useRouter();
  const [editMode, setEditMode] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState("name");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [uploadStatus, setUploadStatus] = useState({
    loading: false,
    error: null,
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");

  const [successType, setSuccessType] = useState(""); // "username", "password", or "profile"

  // Create edited user state
  const [editedUser, setEditedUser] = useState({
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

    // Fetch user data from GCP bucket
    const fetchLoginCredentials = async () => {
      try {
        const url = `/api/user/login_credentials?userId=${user.id}`;
        console.log("Fetching login credentials from:", url);

        const response = await fetch(url);
        if (!response.ok) {
          if (response.status === 404) {
            console.warn("Login credentials not found for user:", user.id);
            return; // Gracefully handle 404
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
          username: data.userId || prev.username, // Map userId to username
        }));
      } catch (error) {
        console.error("Error fetching login credentials:", error);
      }
    };

    const fetchPhotos = async () => {
      try {
        if (!user?.username) {
          console.warn("No username available");
          return;
        }
        console.log("Fetching photos for user:", user.username);
        const response = await fetch(
          `/api/photos/${encodeURIComponent(user.username)}`,
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
        setUploadedPhotos(data.photos || []);
        setEditedUser((prev) => ({
          ...prev,
          photoUrl: data.profilePhoto || "",
          photos: data.photos || [],
        }));
      } catch (error) {
        console.error("Error fetching photos:", error);
        setUploadStatus({ loading: false, error: "Failed to fetch photos" });
      }
    };

    fetchLoginCredentials();
    fetchPhotos();
  }, [user]);

  // Simple helper to get user folder name
  const getUserFolderName = () => {
    if (!user) return "anonymous";
    return user.username;
  };

  // Handle profile photo upload with basic form data
  const handleProfilePhotoUpload = async (e) => {
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
      // Create form data for photo upload
      const formData = new FormData();
      formData.append("audio", file); // Using 'audio' as field name to match server expectation
      formData.append("userName", getUserFolderName());
      formData.append("questionIndex", "0"); // Required by server
      formData.append("type", "profile-photo");

      // Log what we're sending
      console.log("Sending upload with:", {
        fileName: file.name,
        userName: getUserFolderName(),
        type: "profile-photo",
      });

      const response = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });

      // Debug response status
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

      // Check if we received a filePath or URL
      if (data.filePath || data.url) {
        // Prefer the returned URL if available, otherwise construct one
        const photoUrl =
          data.url ||
          `https://storage.googleapis.com/memorial-voices/${data.filePath}`;
        console.log("Setting photo URL to:", photoUrl);

        const updatedUser = {
          ...editedUser,
          photoUrl: photoUrl,
        };
        setEditedUser(updatedUser);
        await setUser(updatedUser);
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

  // Handle gallery photo upload with basic form data
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadStatus({ loading: true, error: null });

    // Upload first file only to simplify
    const file = files[0];

    console.log(
      "Gallery file selected:",
      file.name,
      "Type:",
      file.type,
      "Size:",
      file.size,
    );

    try {
      // Create form data matching what the server expects
      const formData = new FormData();
      formData.append("audio", file); // Server expects 'audio' not 'photo'
      formData.append("userName", getUserFolderName());
      formData.append("questionIndex", "0"); // Server requires this field
      formData.append("type", "gallery"); // Use 'gallery' type

      // Log what we're sending
      console.log("Sending gallery upload with:", {
        fileName: file.name,
        userName: getUserFolderName(),
        type: "gallery",
      });

      const response = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });

      // Debug response status
      console.log("Gallery upload response status:", response.status);

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

        // Update both states with the new URL
        setUploadedPhotos((prev) => [...prev, photoUrl]);
        setEditedUser((prev) => ({
          ...prev,
          photos: [...(prev.photos || []), photoUrl],
        }));

        // Make sure to update the user context as well
        if (setUser) {
          await setUser({
            ...editedUser,
            photos: [...(editedUser.photos || []), photoUrl],
          });
        }
        setUploadStatus({ loading: false, error: null });
      } else {
        console.error("No file path or URL in gallery response:", data);
        throw new Error(
          "Server responded but no file path or URL was provided for gallery upload",
        );
      }
    } catch (error) {
      console.error("Error uploading gallery photo:", error);
      setUploadStatus({
        loading: false,
        error: error.message || "Failed to upload gallery photo",
      });
    }
  };

  // Handle password change
  // In your handlePasswordChange function:
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
      // Use your existing reset-password API route
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: user?.username,
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
      setSuccessType("password"); // Use the success type state
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setPasswordError(
        error.message || "Failed to update password. Please try again.",
      );
    }
  };

  // Handle saving profile changes
  const handleSave = async () => {
    try {
      await setUser(editedUser);
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
                className={`w-full text-left px-4 py-2 rounded-md flex items-center gap-2 ${
                  activeSection === "name"
                    ? "bg-blue-500"
                    : "hover:bg-slate-800"
                }`}
              >
                <FaUser /> Profile
              </button>
              <button
                onClick={() => setActiveSection("gallery")}
                className={`w-full text-left px-4 py-2 rounded-md flex items-center gap-2 ${
                  activeSection === "gallery"
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
                className={`w-full text-left px-4 py-2 rounded-md flex items-center gap-2 ${
                  activeSection === "settings"
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
                <div>
                  <h2 className="text-xl font-light mb-6">Photo Gallery</h2>
                  <p className="text-slate-300 mb-6">
                    Upload multiple photos to help create more accurate AI
                    renderings of your loved one.
                  </p>

                  <div className="mb-8 p-6 bg-slate-800/30 rounded-lg shadow-lg">
                    <h3 className="text-lg font-medium mb-4">Profile Photo</h3>
                    {editedUser.photoUrl ? (
                      <div className="w-32 h-32 rounded-lg overflow-hidden bg-slate-700 shadow-xl hover:scale-105 transition-transform duration-300">
                        <img
                          src={editedUser.photoUrl}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <div className="w-32 h-32 rounded-lg bg-slate-700 shadow-xl flex items-center justify-center cursor-pointer hover:bg-slate-600 transition-colors">
                          <span className="text-slate-400">
                            Upload Profile Photo
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleProfilePhotoUpload}
                          disabled={uploadStatus.loading}
                        />
                      </label>
                    )}
                  </div>

                  <div className="mt-12">
                    <h3 className="text-lg font-medium mb-4">Photo Gallery</h3>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                      {uploadedPhotos.map((photo, index) => (
                        <div
                          key={index}
                          className="aspect-square rounded-lg overflow-hidden bg-slate-700 border-2 border-white hover:scale-105 transition-transform duration-300 cursor-pointer w-24 h-24"
                        >
                          <img
                            src={photo}
                            alt={`Gallery ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {uploadedPhotos.length === 0 && (
                        <label className="aspect-square rounded-lg bg-slate-700 border-2 border-white hover:bg-slate-600 transition-colors cursor-pointer w-24 h-24 flex items-center justify-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                            disabled={uploadStatus.loading}
                          />
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-8 w-8 text-slate-400 hover:text-slate-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </label>
                      )}
                    </div>
                    <div className="mt-6">
                      <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-all duration-300 inline-flex items-center gap-2 shadow-lg">
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
                        Upload More Photos
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoUpload}
                          className="hidden"
                          disabled={uploadStatus.loading}
                        />
                      </label>
                    </div>
                  </div>
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
                        className={`w-full px-4 py-2 bg-slate-900/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          editMode ? "text-white" : "text-slate-400"
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
                        className={`w-full px-4 py-2 bg-slate-900/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          editMode ? "text-white" : "text-slate-400"
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
                        className={`w-full px-4 py-2 bg-slate-900/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          editMode ? "text-white" : "text-slate-400"
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
                        className={`w-full px-4 py-2 bg-slate-900/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          editMode ? "text-white" : "text-slate-400"
                        }`}
                      />
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
                        className={`w-full px-4 py-2 bg-slate-900/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          editMode ? "text-white" : "text-slate-400"
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
                          className={`w-full px-4 py-2 bg-slate-900/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            editMode ? "text-white" : "text-slate-400"
                          }`}
                        />
                        <button
                          onClick={() => setEditMode(true)}
                          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                        >
                          Edit Username
                        </button>
                        {editMode && (
                          <div className="flex gap-4">
                            <input
                              type="text"
                              value={editedUser.username}
                              onChange={(e) =>
                                setEditedUser({
                                  ...editedUser,
                                  username: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2 bg-slate-900/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter new username"
                            />
                            <button
                              onClick={async () => {
                                try {
                                  if (!editedUser.username) {
                                    alert("Please enter a username");
                                    return;
                                  }
                                  if (editedUser.username === user?.username) {
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
                                        oldUsername: user?.username,
                                        newUsername: editedUser.username,
                                      }),
                                    },
                                  );

                                  if (!response.ok) {
                                    throw new Error("Failed to rename folder");
                                  }

                                  const data = await response.json();
                                  if (data.success) {
                                    // Update user context with new username
                                    await setUser({
                                      ...editedUser,
                                      id: editedUser.username,
                                    });
                                    setEditMode(false);
                                    setSaveSuccess(true);
                                    setSuccessType("username");
                                    setTimeout(
                                      () => setSaveSuccess(false),
                                      3000,
                                    );
                                  }
                                } catch (error) {
                                  console.error(
                                    "Error updating username:",
                                    error,
                                  );
                                  alert(
                                    "Failed to update username. Please try again.",
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
