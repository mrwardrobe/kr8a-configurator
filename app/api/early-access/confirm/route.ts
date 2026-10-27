import { manageWaitlistRequest } from '../../../../lib/waitlistManagementRoute';
export const runtime = 'nodejs';
export async function POST(request: Request) { return manageWaitlistRequest(request, 'confirm'); }
