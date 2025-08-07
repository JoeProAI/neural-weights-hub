# Contributing Guidelines

Thank you for your interest in contributing to the OpenAI Open Weights App Builder! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Git for version control
- Code editor (VS Code recommended)

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/openai-app-builder.git
   cd openai-app-builder
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env.local
   # Add your API keys and database URL
   ```

4. **Database Setup**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 📝 Development Workflow

### Branch Naming Convention
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions/updates

### Commit Message Format
Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer]
```

Examples:
- `feat(auth): add Firebase authentication integration`
- `fix(api): resolve OpenAI API rate limiting issue`
- `docs(readme): update installation instructions`

### Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write clean, well-documented code
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Your Changes**
   ```bash
   npm run test
   npm run lint
   npm run type-check
   ```

4. **Commit and Push**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**
   - Use the PR template
   - Link related issues
   - Request review from maintainers

## 🧪 Testing Guidelines

### Test Types
- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test API routes and database interactions
- **E2E Tests**: Test complete user workflows

### Writing Tests
```typescript
// Example unit test
import { render, screen } from '@testing-library/react';
import { ModelComparison } from '@/components/ModelComparison';

describe('ModelComparison', () => {
  it('renders model comparison interface', () => {
    render(<ModelComparison />);
    expect(screen.getByText('gpt-oss-20b')).toBeInTheDocument();
    expect(screen.getByText('gpt-oss-120b')).toBeInTheDocument();
  });
});
```

### Running Tests
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

## 📚 Code Style Guidelines

### TypeScript
- Use strict TypeScript configuration
- Define interfaces for all data structures
- Avoid `any` type - use proper typing
- Use meaningful variable and function names

### React Components
- Use functional components with hooks
- Implement proper prop types with TypeScript interfaces
- Follow the single responsibility principle
- Use descriptive component names

### File Organization
```
src/
├── app/
│   ├── (auth)/              # Route groups
│   ├── api/                 # API routes
│   └── globals.css          # Global styles
├── components/
│   ├── ui/                  # Reusable UI components
│   ├── forms/               # Form components
│   └── layouts/             # Layout components
├── lib/
│   ├── auth.ts              # Authentication utilities
│   ├── db.ts                # Database configuration
│   └── openai.ts            # OpenAI API client
├── types/
│   └── index.ts             # Type definitions
└── utils/
    └── helpers.ts           # Utility functions
```

### Styling Guidelines
- Use Tailwind CSS for styling
- Create reusable component variants
- Follow mobile-first responsive design
- Use semantic HTML elements

## 🐛 Bug Reports

### Before Submitting
- Check existing issues for duplicates
- Test with the latest version
- Gather relevant information

### Bug Report Template
```markdown
**Describe the Bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. Windows 11]
- Browser: [e.g. Chrome 120]
- Node.js version: [e.g. 18.17.0]
```

## 💡 Feature Requests

### Feature Request Template
```markdown
**Feature Description**
A clear description of the feature you'd like to see.

**Use Case**
Explain the problem this feature would solve.

**Proposed Solution**
Describe how you envision this feature working.

**Alternatives Considered**
Any alternative solutions you've considered.

**Additional Context**
Any other context or screenshots about the feature.
```

## 📋 Documentation

### Documentation Standards
- Write clear, concise documentation
- Include code examples where appropriate
- Update documentation with code changes
- Use proper markdown formatting

### API Documentation
- Document all API endpoints
- Include request/response examples
- Specify authentication requirements
- Note any rate limits or restrictions

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Project documentation credits

## 📞 Getting Help

- **Discord**: Join our community server
- **GitHub Discussions**: For questions and discussions
- **Issues**: For bug reports and feature requests
- **Email**: maintainers@openai-app-builder.com

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to the OpenAI Open Weights App Builder! 🎉
