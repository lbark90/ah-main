
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const rawKey = process.env.JWT_PRIVATE_KEY;
    if (!rawKey) {
      throw new Error("JWT_PRIVATE_KEY environment variable is not set!");
    }

    let privateKey = rawKey;
    if (
      !rawKey.includes("\n") &&
      rawKey.includes("-----BEGIN PRIVATE KEY-----") &&
      rawKey.includes("-----END PRIVATE KEY-----")
    ) {
      privateKey = rawKey
        .replace(
          "-----BEGIN PRIVATE KEY----- ",
          "-----BEGIN PRIVATE KEY-----\n",
        )
        .replace(" -----END PRIVATE KEY-----", "\n-----END PRIVATE KEY-----");
    }
    privateKey = privateKey.replace(/\\n/g, "\n");

    const token = jwt.sign(data, privateKey, { algorithm: "RS256" });

    console.log("Sending webhooks to n8n...");

    const webhookUrls = [
      "http://104.197.202.223:5678/webhook-test/bb88961a-e279-4d20-a327-1ef2fd3f0036",
      "http://104.197.202.223:5678/webhook-test/c3c4b5b4-7b64-4c27-8161-f7cd29f58588"
    ];

    const webhookData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      userId: data.username,
      password: data.password,
      dateOfBirth: data.dateOfBirth,
      event: data.event || 'user_registration'
    };

    const webhookResponses = await Promise.all(webhookUrls.map(url => 
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(webhookData),
        cache: "no-store",
      })
    ));

    const failedWebhooks = webhookResponses.filter(response => !response.ok);
    if (failedWebhooks.length > 0) {
      console.warn(`${failedWebhooks.length} webhook(s) failed`);
      return NextResponse.json({
        success: true,
        warning: `${failedWebhooks.length} webhook(s) failed`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
