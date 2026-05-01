export async function GET() {
  const url = "http://127.0.0.1:1985/api/v1/summaries";

  try {
    const res = await fetch(url);

    const data = await res.json();

    // ✅ Correct SRS validation
    if (data.code !== 0) {
      return Response.json({
        success: false,
        message: "SRS returned error",
        data,
      });
    }

    // ✅ IMPORTANT: success = true
    return Response.json({
      success: true,
      message: "SRS server is reachable and responding",
      data,
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
