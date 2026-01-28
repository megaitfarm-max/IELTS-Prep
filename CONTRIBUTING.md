# 🤝 Contributing to IELTS Prep Platform

First off, thank you for considering contributing to our project! It's people like you that make this learning platform amazing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for everyone. We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Positive behaviors include:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behaviors include:**
- Trolling, insulting/derogatory comments, and personal attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Git
- Ollama (for AI features)
- Code editor (VS Code recommended)

### Setup Development Environment

1. **Fork the repository**
   - Click the "Fork" button at the top right of the repo page

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/english.git
   cd english
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/english.git
   ```

4. **Install dependencies**
   ```bash
   npm run install:all
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   pip install -r requirements-dev.txt  # Dev dependencies
   ```

5. **Set up environment**
   ```bash
   cp .env.example .env
   # Configure your local environment variables
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

## 🔄 Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
# or
git checkout -b docs/what-you-are-documenting
```

**Branch naming conventions:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `style/` - UI/UX improvements

### 2. Make Your Changes

- Write clean, readable code
- Follow our coding standards (see below)
- Add tests for new features
- Update documentation as needed

### 3. Test Your Changes

```bash
# Frontend tests
cd frontend
npm run test
npm run lint

# Backend tests
cd backend
pytest
python -m flake8
```

### 4. Commit Your Changes

Follow our commit message guidelines (see below)

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Create Pull Request

- Go to the original repository
- Click "New Pull Request"
- Select your fork and branch
- Fill out the PR template

## 💻 Coding Standards

### Frontend (React + JavaScript/TypeScript)

#### File Structure
```
components/
├── ComponentName/
│   ├── ComponentName.jsx
│   ├── ComponentName.module.css
│   ├── ComponentName.test.jsx
│   └── index.js  (export file)
```

#### CSS Modules
```css
/* ✅ Good - Use CSS Modules */
.container {
  padding: var(--space-4);
  background: var(--gray-100);
}

/* ❌ Bad - No inline styles */
<div style={{ padding: '16px' }}>
```

#### Component Guidelines
```jsx
// ✅ Good - Clean, functional component
import styles from './Button.module.css';

export const Button = ({ children, variant = 'primary', onClick }) => {
  return (
    <button 
      className={styles[variant]} 
      onClick={onClick}
    >
      {children}
    </button>
  );
};

// ❌ Bad - Inline styles, unclear naming
export default ({ kids, v, fn }) => (
  <button style={{ color: 'blue' }} onClick={fn}>{kids}</button>
);
```

#### Import Order
```javascript
// 1. React and third-party libraries
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Internal utilities and hooks
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/date';

// 3. Components
import { Button } from '@/components/Button';

// 4. Styles
import styles from './MyComponent.module.css';
```

### Backend (Python + FastAPI)

#### File Structure
```python
# ✅ Good - Clear, type-hinted, documented
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter()

@router.get("/users/{user_id}")
async def get_user(
    user_id: int,
    db: Session = Depends(get_db)
) -> UserResponse:
    """
    Retrieve user by ID.
    
    Args:
        user_id: The ID of the user to retrieve
        db: Database session
        
    Returns:
        UserResponse object
        
    Raises:
        HTTPException: If user not found
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```

#### Code Style
- Follow PEP 8
- Use type hints
- Write docstrings (Google style)
- Maximum line length: 100 characters
- Use `black` for formatting
- Use `flake8` for linting

### CSS Guidelines

#### Use Design Tokens
```css
/* ✅ Good */
.card {
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  background: var(--gray-100);
  box-shadow: var(--shadow-md);
  transition: var(--transition-base);
}

/* ❌ Bad */
.card {
  padding: 24px;
  border-radius: 12px;
  background: #f3f4f6;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: 0.2s;
}
```

#### Responsive Design
```css
/* Mobile-first approach */
.container {
  padding: var(--space-4);
}

@media (min-width: 768px) {
  .container {
    padding: var(--space-8);
  }
}

@media (min-width: 1024px) {
  .container {
    padding: var(--space-12);
  }
}
```

## 📝 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```bash
feat(reading): add vocabulary builder to passages

- Implemented word highlighting
- Added save to flashcards feature
- Integrated with spaced repetition system

Closes #123
```

```bash
fix(speaking): resolve audio recording issue on Safari

The MediaRecorder API wasn't properly initialized on Safari.
Added polyfill and fallback mechanism.

Fixes #456
```

## 🔍 Pull Request Process

### Before Submitting

- [ ] Code follows our style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] Tests added/updated and passing
- [ ] No console errors or warnings
- [ ] Responsive design tested
- [ ] Accessibility checked

### PR Template

Use this template when creating a PR:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Manual testing completed
- [ ] Cross-browser tested

## Screenshots (if applicable)
Add screenshots for UI changes

## Related Issues
Closes #issue_number

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed
- [ ] Documented
- [ ] Tests added
```

### Review Process

1. At least one maintainer review required
2. All CI checks must pass
3. No merge conflicts
4. Approved by code owner (if applicable)

### After Merge

- Delete your branch
- Update your fork
- Close related issues

## 🧪 Testing Guidelines

### Frontend Testing

```javascript
// ComponentName.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Backend Testing

```python
# test_users.py
def test_get_user_success(client, sample_user):
    """Test successful user retrieval"""
    response = client.get(f"/api/users/{sample_user.id}")
    assert response.status_code == 200
    assert response.json()["email"] == sample_user.email

def test_get_user_not_found(client):
    """Test 404 when user doesn't exist"""
    response = client.get("/api/users/99999")
    assert response.status_code == 404
```

## 📚 Documentation

### Code Documentation

- Use JSDoc for JavaScript/TypeScript
- Use docstrings for Python
- Explain "why", not "what"
- Update README.md for significant changes

### User Documentation

- Update feature descriptions in FEATURES.md
- Add usage examples
- Include screenshots for UI changes
- Update API documentation

## 🎯 Where to Contribute

### Good First Issues

Look for issues labeled `good-first-issue`:
- Simple bug fixes
- Documentation improvements
- UI enhancements
- Test coverage

### High Priority

Issues labeled `high-priority`:
- Critical bugs
- Performance issues
- Security vulnerabilities

### Feature Requests

Check FEATURES.md for planned features

## 💬 Communication

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and general discussions
- **Pull Requests**: Code review and discussion

## 🏆 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Eligible for contributor badges

## ❓ Questions?

- Check existing issues and discussions
- Review documentation
- Ask in GitHub Discussions
- Contact maintainers

---

**Thank you for contributing! 🎉**

Your efforts help thousands of IELTS learners achieve their dreams.
