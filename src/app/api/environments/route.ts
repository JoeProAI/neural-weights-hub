// API route for environment management with model volumes
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { ModelService } from '@/lib/model-service';
import { DaytonaClient } from '@/lib/daytona-client';

const modelService = new ModelService();
const daytonaClient = new DaytonaClient();

// GET /api/environments - List all environments for the user
export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    const environments = await daytonaClient.listEnvironments();
    
    // Filter environments for this user (based on naming convention)
    const userEnvironments = environments.filter(env => 
      env.name.includes(user.uid.substring(0, 8))
    );

    return NextResponse.json({
      success: true,
      data: userEnvironments,
    });
  } catch (error: any) {
    console.error('Error fetching environments:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch environments',
        message: error.message,
      },
      { status: 500 }
    );
  }
});

// POST /api/environments - Create new environment with model volumes
export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    const { name, models, template } = await request.json();
    
    if (!name || !models || !Array.isArray(models)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, models',
        },
        { status: 400 }
      );
    }

    // Validate models
    const validModels = ['gpt-oss-20b', 'gpt-oss-120b'];
    const invalidModels = models.filter((model: string) => !validModels.includes(model));
    
    if (invalidModels.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid models: ${invalidModels.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Create environment with model volumes
    const result = await modelService.createEnvironmentWithModels(
      name,
      models,
      user.uid
    );

    return NextResponse.json({
      success: true,
      message: 'Environment created successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Error creating environment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create environment',
        message: error.message,
      },
      { status: 500 }
    );
  }
});
