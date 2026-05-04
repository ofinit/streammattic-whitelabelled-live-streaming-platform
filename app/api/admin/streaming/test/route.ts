import { listFiveCentsCdnPushServers } from "@/lib/streaming/fivecentscdn-service";
import { getStreamingSettings, testSrsConnection } from "@/lib/srs-settings";

export async function GET() {
  try {
    const settings = await getStreamingSettings();
    if (settings.backendType === "fivecentscdn") {
      const data = await listFiveCentsCdnPushServers(settings);
      return Response.json({
        success: true,
        message: "5CentsCDN API is reachable and responding",
        data,
      });
    }

    const result = await testSrsConnection(settings);
    return Response.json({
      success: result.ok,
      message: result.message,
      data: { status: result.status, url: result.url },
    });
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const settings = body?.settings ?? body;

  if (settings?.backendType === "fivecentscdn") {
    try {
      const data = await listFiveCentsCdnPushServers(settings);
      return Response.json({
        success: true,
        message: "5CentsCDN API is reachable and responding",
        data,
      });
    } catch (error: any) {
      return Response.json(
        {
          success: false,
          message: error.message,
        },
        { status: 500 },
      );
    }
  }

  return GET();
}
