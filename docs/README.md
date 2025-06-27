# Mellow Documentation

This directory contains the complete documentation for Mellow, hosted via GitHub Pages.

## 📚 Documentation Structure

- **[index.md](index.md)** - Main documentation homepage
- **[getting-started.md](getting-started.md)** - Setup and initial configuration guide
- **[commands.md](commands.md)** - Complete command reference
- **[privacy-policy.md](privacy-policy.md)** - Privacy policy and data handling
- **[terms-of-service.md](terms-of-service.md)** - Terms of service
- **[contributing.md](contributing.md)** - Contribution guidelines
- **[api.md](api.md)** - Technical API reference

## 🌐 Accessing Documentation

The documentation is available at: `https://thingspace.github.io/Mellow`

## 🛠️ Local Development

To run the documentation locally using Jekyll:

```bash
# Install Jekyll (requires Ruby)
gem install bundler jekyll

# Navigate to docs directory
cd docs

# Install dependencies
bundle install

# Serve locally
bundle exec jekyll serve

# Open http://localhost:4000/Mellow in your browser
```

## 📝 Updating Documentation

1. Edit markdown files in this directory
2. Commit and push changes to the main branch
3. GitHub Pages will automatically rebuild and deploy
4. Changes appear within a few minutes

## 🎨 Customization

The documentation uses Jekyll with the Minima theme. Configuration is in `_config.yml`.

### Adding New Pages

1. Create a new `.md` file in this directory
2. Add front matter with title and nav_order
3. Update `_config.yml` header_pages if needed

### Styling

Custom styles can be added by creating `assets/css/style.scss`:

```scss
---
---

@import "minima";

/* Custom styles here */
```

## 🔗 Links and References

- [Jekyll Documentation](https://jekyllrb.com/docs/)
- [GitHub Pages Documentation](https://docs.github.com/pages)
- [Markdown Guide](https://www.markdownguide.org/)
