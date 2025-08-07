// API route for model management
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { ModelService } from '@/lib/model-service';

const modelService = new ModelService();

// GET /api/models - List all models and their availability
export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    const models = await modelService.updateModelAvailability();
    
    return NextResponse.json({
      success: true,
      data: models,
    });
  } catch (error: any) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch models',
        message: error.message,
      },
      { status: 500 }
    );
  }
});

// POST /api/models - Deploy model instance for user
export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    const { model, action } = await request.json();
    
    if (!model || !['gpt-oss-20b', 'gpt-oss-120b'].includes(model)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid model specified',
        },
        { status: 400 }
      );
    }

    if (action === 'setup') {
      // ADMIN: Setup model for platform (one-time)
      modelService.setupModel(model).catch(error => {
        console.error(`Model setup failed for ${model}:`, error);
      });

      return NextResponse.json({
        success: true,
        message: `Setup started for ${model}`,
        data: {
          model,
          status: 'pending',
        },
      });
    } else {
      // USER: Deploy model instance
      const apiUrl = await modelService.deployModel(model, user.uid);
      
      return NextResponse.json({
        success: true,
        message: `Model instance deployed for ${model}`,
        data: {
          model,
          apiUrl,
          status: 'creating',
        },
      });
    }
  } catch (error: any) {
    console.error('Error with model operation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process model operation',
        message: error.message,
      },
      { status: 500 }
    );
  }
});
