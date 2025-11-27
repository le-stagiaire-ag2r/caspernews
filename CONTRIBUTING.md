# Contributing to Casper DeFi Yield Optimizer

Thank you for your interest in contributing to the Casper DeFi Yield Optimizer! This document provides guidelines for contributing to this project.

## 🚀 Getting Started

1. **Fork the repository**
   ```bash
   git fork https://github.com/le-stagiaire-ag2r/caspernews.git
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR-USERNAME/caspernews.git
   cd caspernews
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Follow the setup instructions** in the [README.md](./README.md)

## 📋 Development Guidelines

### Code Style

- **TypeScript/JavaScript**: Follow the Airbnb style guide
- **Rust**: Follow the official Rust style guide
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(frontend): add wallet connection UI
fix(contracts): resolve integer overflow in share calculation
docs(tutorial): update Part 3 with new examples
```

### Testing

- Write tests for all new features
- Ensure all existing tests pass before submitting PR
- Aim for high test coverage

**Run tests:**
```bash
# Frontend
cd frontend && npm test

# Contracts
cd contracts && cargo odra test

# Backend
cd backend && npm test
```

### Documentation

- Update README.md if you change functionality
- Add JSDoc/RustDoc comments for public APIs
- Update tutorial documentation if relevant
- Include examples in your documentation

## 🔄 Pull Request Process

1. **Update your branch** with the latest main
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-feature-branch
   git rebase main
   ```

2. **Run all tests** and ensure they pass

3. **Update documentation** as needed

4. **Create a Pull Request** with:
   - Clear title following commit message format
   - Detailed description of changes
   - Screenshots (if UI changes)
   - References to related issues

5. **Address review feedback** promptly

6. **Squash commits** if requested before merge

## 🐛 Reporting Bugs

When reporting bugs, please include:

- **Description**: Clear description of the bug
- **Steps to reproduce**: Detailed steps to reproduce the issue
- **Expected behavior**: What you expected to happen
- **Actual behavior**: What actually happened
- **Environment**: OS, browser, Node.js version, etc.
- **Screenshots**: If applicable
- **Logs**: Relevant error messages or logs

**Use this template:**

```markdown
## Bug Description
[Clear description]

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. See error

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Environment
- OS: [e.g., macOS 12.0]
- Browser: [e.g., Chrome 96]
- Node.js: [e.g., v18.0.0]

## Screenshots
[If applicable]

## Additional Context
[Any other relevant information]
```

## 💡 Feature Requests

We welcome feature requests! Please:

1. Check if the feature already exists or is planned
2. Clearly describe the feature and its benefits
3. Provide use cases and examples
4. Consider implementation complexity

## 🔒 Security Issues

**DO NOT** open public issues for security vulnerabilities.

Instead:
- Email security concerns to: [security email - to be added]
- Provide detailed information about the vulnerability
- Allow reasonable time for fixes before disclosure

## 📚 Resources

- [Casper Network Documentation](https://docs.casper.network/)
- [Odra Framework](https://odra.dev/)
- [CSPR.click Docs](https://docs.cspr.click/)
- [React Documentation](https://react.dev/)

## 🤝 Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes:**
- Trolling, insulting/derogatory comments, and personal attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

## ❓ Questions?

Feel free to:
- Open a discussion on GitHub
- Ask in the Casper Discord
- Review existing issues and PRs

## 🎉 Recognition

Contributors will be:
- Listed in the project's contributors page
- Mentioned in release notes for significant contributions
- Acknowledged in project documentation

Thank you for contributing to Casper DeFi Yield Optimizer! 🚀
