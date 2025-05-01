"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useUser, UserData } from "../../lib/context/UserContext";
import { useState } from "react";

const registrationSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores"),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export default function RegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { registerUser } = useUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
  });

  const onSubmit = async (data: RegistrationFormData) => {
    setIsSubmitting(true);

    try {
      // Prepare data for GCP storage
      const gcpData = {
        firstName: data.firstName,
        middleName: data.middleName || '',
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phone,
        userId: data.username, // Using username as userId
        password: data.password,
        dateOfBirth: data.dateOfBirth,
        created_at: new Date().toISOString(),
        last_modified: new Date().toISOString()
      };
      
      // Upload to GCP
      await fetch('/api/storage/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(gcpData)
      });

      // Register user using context
      await registerUser(data as UserData);

      // Navigate to interview page
      router.push("/interview");
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(
        "There was an error registering your information. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      key="registration-form"
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
    >
      <div className="space-y-4">
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-slate-300 mb-1"
          >
            Username
          </label>
          <input
            type="text"
            id="username"
            style={{ backgroundColor: "#141c2f", color: "#e2e8f0" }}
            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 [&:-webkit-autofill]:bg-[#141c2f] [&:-webkit-autofill]:text-[#e2e8f0] [&:-webkit-autofill_selected]:bg-[#141c2f] [&:-webkit-autofill]:!fill-[#e2e8f0] ${
              errors.username ? "border-red-500" : "border-slate-600"
            }`}
            placeholder="Choose a unique username"
            {...register("username")}
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-500">
              {errors.username.message}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-slate-300 mb-1"
          >
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            style={{ backgroundColor: "#141c2f", color: "#e2e8f0" }}
            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 [&:-webkit-autofill]:bg-[#141c2f] [&:-webkit-autofill]:text-[#e2e8f0] [&:-webkit-autofill_selected]:bg-[#141c2f] [&:-webkit-autofill]:!fill-[#e2e8f0] ${
              errors.firstName ? "border-red-500" : "border-slate-600"
            }`}
            placeholder="Enter your first name"
            {...register("firstName")}
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-500">
              {errors.firstName.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="middleName"
            className="block text-sm font-medium text-slate-300 mb-1"
          >
            Middle Name
          </label>
          <input
            type="text"
            id="middleName"
            style={{ backgroundColor: "#141c2f", color: "#e2e8f0" }}
            className={`w-full px-4 py-2 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 [&:-webkit-autofill]:bg-[#141c2f] [&:-webkit-autofill]:text-[#e2e8f0] [&:-webkit-autofill_selected]:bg-[#141c2f] [&:-webkit-autofill]:!fill-[#e2e8f0]`}
            placeholder="Enter your middle name (optional)"
            {...register("middleName")}
          />
        </div>

        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-slate-300 mb-1"
          >
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            style={{ backgroundColor: "#141c2f", color: "#e2e8f0" }}
            className={`w-full px-4 py-2 bg-[#141c2f] border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 [&:-webkit-autofill]:bg-[#141c2f] [&:-webkit-autofill]:text-[#e2e8f0] [&:-webkit-autofill_selected]:bg-[#141c2f] [&:-webkit-autofill]:!fill-[#e2e8f0] ${
              errors.lastName ? "border-red-500" : "border-slate-600"
            }`}
            placeholder="Enter your last name"
            {...register("lastName")}
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-500">
              {errors.lastName.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-300 mb-1"
          >
            Email Address
          </label>
          <input
            type="email"
            id="email"
            style={{ backgroundColor: "#141c2f", color: "#e2e8f0" }}
            className={`w-full px-4 py-2 bg-[#141c2f] border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 [&:-webkit-autofill]:bg-[#141c2f] [&:-webkit-autofill]:text-[#e2e8f0] [&:-webkit-autofill_selected]:bg-[#141c2f] [&:-webkit-autofill]:!fill-[#e2e8f0] ${
              errors.email ? "border-red-500" : "border-slate-600"
            }`}
            placeholder="Enter your email address"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="dateOfBirth"
            className="block text-sm font-medium text-slate-300 mb-1"
          >
            Date of Birth
          </label>
          <input
            type="date"
            id="dateOfBirth"
            style={{ backgroundColor: "#141c2f", color: "#e2e8f0" }}
            className={`w-full px-4 py-2 bg-[#141c2f] border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 [&:-webkit-autofill]:bg-[#141c2f] [&:-webkit-autofill]:text-[#e2e8f0] [&:-webkit-autofill_selected]:bg-[#141c2f] [&:-webkit-autofill]:!fill-[#e2e8f0] ${
              errors.dateOfBirth ? "border-red-500" : "border-slate-600"
            }`}
            {...register("dateOfBirth")}
          />
          {errors.dateOfBirth && (
            <p className="mt-1 text-sm text-red-500">
              {errors.dateOfBirth.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-slate-300 mb-1"
          >
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            style={{ backgroundColor: "#141c2f", color: "#e2e8f0" }}
            className={`w-full px-4 py-2 bg-[#141c2f] border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 [&:-webkit-autofill]:bg-[#141c2f] [&:-webkit-autofill]:text-[#e2e8f0] [&:-webkit-autofill_selected]:bg-[#141c2f] [&:-webkit-autofill]:!fill-[#e2e8f0] ${
              errors.phone ? "border-red-500" : "border-slate-600"
            }`}
            placeholder="Enter your phone number"
            {...register("phone")}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-300 mb-1"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            style={{ backgroundColor: "#141c2f", color: "#e2e8f0" }}
            className={`w-full px-4 py-2 bg-[#141c2f] border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 [&:-webkit-autofill]:bg-[#141c2f] [&:-webkit-autofill]:text-[#e2e8f0] [&:-webkit-autofill_selected]:bg-[#141c2f] [&:-webkit-autofill]:!fill-[#e2e8f0] ${
              errors.password ? "border-red-500" : "border-slate-600"
            }`}
            placeholder="Enter your password"
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-slate-300 mb-1"
          >
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            style={{ backgroundColor: "#141c2f", color: "#e2e8f0" }}
            className={`w-full px-4 py-2 bg-[#141c2f] border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 [&:-webkit-autofill]:bg-[#141c2f] [&:-webkit-autofill]:text-[#e2e8f0] [&:-webkit-autofill_selected]:bg-[#141c2f] [&:-webkit-autofill]:!fill-[#e2e8f0] ${
              errors.confirmPassword ? "border-red-500" : "border-slate-600"
            }`}
            placeholder="Confirm your password"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-md transition-colors flex items-center justify-center ${
            isSubmitting ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {isSubmitting ? "Processing..." : "Start Now"}
        </button>
      </div>

      <p className="text-sm text-slate-400 text-center mt-6">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </form>
  );
}