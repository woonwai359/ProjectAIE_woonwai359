import { NextResponse, type NextRequest } from 'next/server';

const MOCK_AUTH = process.env.MOCK_AUTH === 'true';

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);

  if (MOCK_AUTH) {
    const mockUserId =
      request.headers.get('x-mock-user-id') ?? process.env.MOCK_USER_ID ?? '6512345678';
    const mockRole =
      request.headers.get('x-mock-role') ?? process.env.MOCK_ROLE ?? 'student';
    const mockFaculty =
      request.headers.get('x-mock-faculty') ?? process.env.MOCK_FACULTY ?? 'science';

    requestHeaders.set('x-user-id', mockUserId);
    requestHeaders.set('x-layer1-role', mockRole);
    requestHeaders.set('x-faculty', mockFaculty);
  } else {
    requestHeaders.delete('x-mock-user-id');
    requestHeaders.delete('x-mock-role');
    requestHeaders.delete('x-mock-faculty');
  }

  // ปล่อยผ่านทุกหน้า ไม่ต้องตรวจ path แล้วเด้งกลับ
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};