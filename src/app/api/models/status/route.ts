// API route for model deployment status
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { ModelService } from '@/lib/model-service';

const modelService = new ModelService();

// GET /api/models/status - Get deployment status for all models
export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    const url = new URL(request.url);
    const model = url.searchParams.get('model');

    if (model) {
      // Get status for specific model
      if (!['gpt-oss-20b', 'gpt-oss-120b'].includes(model)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid model specified',
          },
          { status: 400 }
        );
      }

      const status = modelService.getDeploymentStatus(model as any);
      
      return NextResponse.json({
        success: true,
        data: status,
      });
    } else {
      // Get status for all models
      const statuses = modelService.getAllDeploymentStatuses();
      
      return NextResponse.json({
        success: true,
        data: statuses,
      });
    }
  } catch (error: any) {
    console.error('Error fetching model status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch model status',
        message: error.message,
      },
      { status: 500 }
    );
  }
});
