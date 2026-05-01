export async function GET() {
  const url = "http://127.0.0.1:1985/api/v1/summaries";

  try {
    console.log("Calling SRS:", url);

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`SRS API failed: ${res.status}`);
    }

    const data = await res.json();

    return Response.json({
      success: true,
      url,
      data,
    });
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        url,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
