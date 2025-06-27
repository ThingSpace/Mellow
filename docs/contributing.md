---
layout: default
title: Contributing
nav_order: 6
---

# Contributing to Mellow

We welcome contributions that make mental health support more accessible and effective! This guide will help you get started with contributing to the Mellow project.

## 🌟 Ways to Contribute

### 🛠️ Code Contributions
- New coping tools and techniques
- Improved crisis detection algorithms
- Accessibility enhancements
- Performance optimizations
- Bug fixes and improvements
- UI/UX improvements

### 📝 Content & Resources
- Mental health educational content
- Crisis resource databases
- Multilingual support
- Inclusive language improvements
- Documentation updates

### 🧪 Testing & Feedback
- User experience testing
- Accessibility testing
- Feature suggestions
- Bug reports
- Security reviews

### 🎨 Design & Documentation
- User interface improvements
- Documentation enhancements
- Visual design assets
- Accessibility improvements

## 🚀 Getting Started

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Mellow.git
   cd Mellow
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Fill in your environment variables
   ```

4. **Database Setup**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

5. **Start Development**
   ```bash
   npm run dev
   ```

### Project Structure

```
src/
├── commands/           # Slash commands
│   ├── slash/         # Public commands
│   └── private/       # Admin-only commands
├── events/            # Discord event handlers
├── functions/         # Utility functions
├── services/          # Core services (AI, database, etc.)
├── configs/           # Configuration files
└── index.js          # Main entry point

docs/                  # Documentation
prisma/               # Database schema
.github/              # GitHub workflows and templates
```

## 📋 Development Guidelines

### Code Standards

#### JavaScript/Node.js
- Use ES6+ features and modern syntax
- Follow the existing code style (ESLint configured)
- Use meaningful variable and function names
- Add JSDoc comments for functions
- Handle errors gracefully

#### Example Code Style
```javascript
/**
 * Handle user check-in command
 * @param {Object} client - Discord client
 * @param {Object} interaction - Discord interaction
 * @returns {Promise<void>}
 */
async function handleCheckIn(client, interaction) {
    try {
        // Implementation here
    } catch (error) {
        console.error('Error in check-in:', error)
        // Error handling
    }
}
```

### Mental Health Considerations

#### Sensitive Content
- Use trauma-informed language
- Avoid triggering content in examples
- Include content warnings where appropriate
- Respect privacy and anonymity

#### Crisis Detection
- Test crisis detection thoroughly
- Ensure appropriate response escalation
- Maintain professional resource accuracy
- Regular review of crisis protocols

#### Accessibility
- Support screen readers
- Provide alternative text for images
- Use clear, simple language
- Consider neurodiversity in design

### Database Changes

#### Schema Modifications
```bash
# Create migration
npx prisma migrate dev --name your_migration_name

# Generate client
npx prisma generate
```

#### Best Practices
- Always create migrations for schema changes
- Test migrations on sample data
- Consider data privacy in schema design
- Document breaking changes

### Testing

#### Manual Testing
- Test all command interactions
- Verify error handling
- Check privacy controls
- Test crisis detection scenarios

#### Feature Testing
- Test with different user roles
- Verify permissions work correctly
- Check cross-platform compatibility
- Test accessibility features

## 🔧 Contribution Process

### 1. Planning
- Check existing issues for similar work
- Create or comment on relevant issues
- Discuss major changes before implementation
- Consider mental health implications

### 2. Development
- Create feature branch from main/master
- Make focused, atomic commits
- Write clear commit messages
- Follow code style guidelines

### 3. Testing
- Test thoroughly on your local setup
- Verify no breaking changes
- Check accessibility compliance
- Test crisis detection if relevant

### 4. Documentation
- Update relevant documentation
- Add JSDoc comments for new functions
- Update command reference if needed
- Include usage examples

### 5. Pull Request
- Create descriptive PR title and description
- Link relevant issues
- Include testing information
- Request appropriate reviewers

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Mental Health Impact
- [ ] No mental health impact
- [ ] Improves crisis detection
- [ ] Enhances user safety
- [ ] Requires review by mental health expert

## Testing
- [ ] Local testing completed
- [ ] Crisis scenarios tested
- [ ] Accessibility verified
- [ ] No breaking changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No sensitive data exposed
```

## 🏷️ Issue Guidelines

### Bug Reports
Use the bug report template and include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details
- Screenshots if applicable

### Feature Requests
- Describe the problem you're solving
- Explain the proposed solution
- Consider mental health implications
- Provide use cases and examples

### Mental Health Features
- Consult mental health guidelines
- Consider crisis scenarios
- Include safety considerations
- Provide professional references

## 🛡️ Safety & Privacy

### Data Protection
- Never commit sensitive data
- Use environment variables for secrets
- Follow GDPR and privacy guidelines
- Implement data minimization

### Mental Health Safety
- Follow trauma-informed principles
- Maintain professional boundaries
- Respect user privacy
- Provide appropriate resources

### Crisis Protocols
- Understand crisis detection systems
- Know escalation procedures
- Maintain resource accuracy
- Regular safety reviews

## 🤝 Code of Conduct

### Our Standards
- **Respectful Communication** - Treat all contributors with respect
- **Mental Health Awareness** - Understand the sensitivity of our domain
- **Inclusive Environment** - Welcome contributors from all backgrounds
- **Constructive Feedback** - Provide helpful, actionable feedback
- **Professional Conduct** - Maintain professional standards

### Unacceptable Behavior
- Harassment or discrimination
- Inappropriate mental health advice
- Sharing sensitive user data
- Disruptive or harmful conduct

### Enforcement
Issues will be addressed by the project maintainers. Serious violations may result in temporary or permanent bans from the project.

## 📚 Resources

### Mental Health Guidelines
- [Crisis Intervention Guidelines](https://www.samhsa.gov/find-help/national-helpline)
- [Trauma-Informed Care Principles](https://www.cdc.gov/cpr/infographics/6_principles_trauma_info.htm)
- [Digital Mental Health Best Practices](https://www.apa.org/science/about/psa/2017/10/digital-mental-health)

### Development Resources
- [Discord.js Documentation](https://discord.js.org/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Prisma Documentation](https://www.prisma.io/docs/)

### Accessibility Resources
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Discord Accessibility](https://discord.com/accessibility)

## 💬 Getting Help

### Community Support
- **Discord Server** - [Join our support community](https://discord.gg/C3ZuXPP7Hc)
- **GitHub Discussions** - Ask questions and share ideas
- **Documentation** - Check these docs first

### Development Help
- **Code Reviews** - Request reviews from maintainers
- **Architecture Questions** - Tag appropriate maintainers
- **Mental Health Guidance** - Consult with mental health team

### Contact Information
- **General Questions** - GitHub Discussions
- **Security Issues** - security@athing.space
- **Mental Health Concerns** - Contact maintainers privately

## 🙏 Recognition

### Contributors
All contributors are recognized in our README and release notes. We value every contribution, no matter how small.

### Special Recognition
- Mental health professionals who guide our approach
- Accessibility experts who improve our reach
- Community members who provide feedback
- Security researchers who keep us safe

---

Thank you for contributing to Mellow! Together, we're making mental health support more accessible for everyone. 💜

*Remember: Every contribution helps someone feel less alone.*
