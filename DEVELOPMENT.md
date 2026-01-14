# Development Guide - FriendFinder Dating App

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher recommended)
- **npm** or **yarn** package manager
- A code editor (VS Code recommended)

### Initial Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Open in Browser**
   - Local: `http://localhost:5173`
   - Network: Check terminal for your IP address (e.g., `http://192.168.1.100:5173`)

---

## 📁 Project Structure

```
FriendFinder/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Header.jsx      # App header with menu
│   │   ├── BottomNav.jsx   # Bottom navigation bar
│   │   └── Icons.jsx       # SVG icon components
│   │
│   ├── pages/              # Page components
│   │   ├── Home.jsx        # Swipe interface (main)
│   │   ├── Matches.jsx     # Matches list
│   │   ├── Messages.jsx    # Chat interface
│   │   ├── Search.jsx      # Search & filters
│   │   ├── Profile.jsx     # User profile
│   │   ├── Login.jsx       # Authentication
│   │   └── Calendar.jsx    # Calendar (placeholder)
│   │
│   ├── data/               # Mock data
│   │   ├── datingProfiles.js
│   │   ├── destinations.js
│   │   └── mockData.js
│   │
│   ├── utils/              # Utility functions
│   │   ├── localStorage.js # Data persistence
│   │   └── activityTracker.js # User activity tracking
│   │
│   ├── App.jsx             # Main app component
│   ├── App.css             # App-specific styles
│   ├── index.css           # Global styles & CSS variables
│   └── main.jsx            # React entry point
│
├── index.html              # HTML template
├── package.json            # Dependencies & scripts
├── vite.config.js         # Vite configuration
└── README.md               # Project documentation
```

---

## 🛠️ Development Commands

### Development Server
```bash
npm run dev
```
- Starts Vite dev server with hot module replacement (HMR)
- Auto-reloads on file changes
- Accessible on localhost and network IP

### Build for Production
```bash
npm run build
```
- Creates optimized production build in `dist/` folder
- Minifies code, optimizes assets
- Ready for deployment

### Preview Production Build
```bash
npm run preview
```
- Serves the production build locally
- Test production build before deploying

---

## 🎨 Development Workflow

### 1. **Adding New Features**

#### Create a New Page
1. Create file in `src/pages/YourPage.jsx`
2. Add route in `src/App.jsx`:
   ```jsx
   case 'yourpage':
     return <YourPage />
   ```
3. Add navigation item in `src/components/BottomNav.jsx` (if needed)

#### Create a New Component
1. Create file in `src/components/YourComponent.jsx`
2. Export and import where needed:
   ```jsx
   import YourComponent from './components/YourComponent'
   ```

### 2. **Styling Guidelines**

#### Use CSS Variables
All colors, spacing, and design tokens are in `src/index.css`:
```css
:root {
  --primary-color: #7c3aed;
  --text-primary: #0f172a;
  /* ... more variables */
}
```

#### Component Styles
- Use inline styles for dynamic styles
- Use CSS classes for reusable styles
- Follow mobile-first approach

### 3. **State Management**

Currently using React hooks (`useState`, `useEffect`):
- **Local State**: Component-level state
- **Persistent State**: `localStorage` via `src/utils/localStorage.js`
- **Future**: Consider Context API or Redux for complex state

### 4. **Data Management**

#### Mock Data
- Located in `src/data/`
- Edit `datingProfiles.js` to add/modify profiles
- Edit `mockData.js` for user data

#### LocalStorage
- Temporary solution until Supabase integration
- Utilities in `src/utils/localStorage.js`
- Keys defined in `STORAGE_KEYS` constant

---

## 🔧 Configuration

### Vite Configuration (`vite.config.js`)
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,        // Allow external connections
    port: 5173,      // Development server port
  },
})
```

### Environment Variables (Future)
Create `.env` file for:
- Supabase URL & keys
- API endpoints
- Feature flags

---

## 📱 Mobile Development

### Testing on Mobile Device

1. **Find Your IP Address**
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   # or
   ip addr
   ```

2. **Start Dev Server**
   ```bash
   npm run dev
   ```

3. **Access on Mobile**
   - Connect phone to same Wi-Fi
   - Open browser: `http://YOUR_IP:5173`
   - Example: `http://192.168.1.100:5173`

### Mobile-Specific Features
- Touch gestures (swipe, tap)
- Safe area support (notches)
- Responsive breakpoints
- Touch-friendly button sizes (min 44x44px)

---

## 🧪 Testing Strategy

### Manual Testing Checklist
- [ ] Swipe gestures work smoothly
- [ ] Photo gallery swipes correctly
- [ ] Match animations trigger
- [ ] Undo feature works
- [ ] Filters apply correctly
- [ ] Messages send/receive
- [ ] Profile updates save
- [ ] Navigation works on all tabs

### Browser Testing
Test on:
- Chrome/Edge (Desktop & Mobile)
- Safari (iOS)
- Firefox
- Samsung Internet

---

## 🚀 Deployment

### Build Process
```bash
# 1. Build for production
npm run build

# 2. Test production build
npm run preview

# 3. Deploy dist/ folder
```

### Deployment Options

#### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

#### Netlify
1. Connect GitHub repo
2. Build command: `npm run build`
3. Publish directory: `dist`

#### GitHub Pages
```bash
npm install -g gh-pages
npm run build
gh-pages -d dist
```

---

## 🔄 Next Development Steps

### Phase 1: Backend Integration
1. **Set up Supabase**
   - Create project
   - Set up authentication
   - Create database tables
   - Configure Row Level Security (RLS)

2. **Migrate from localStorage**
   - Replace `localStorage.js` calls
   - Implement real-time subscriptions
   - Add error handling

### Phase 2: Enhanced Features
1. **Real-time Messaging**
   - WebSocket or Supabase Realtime
   - Typing indicators
   - Read receipts

2. **Advanced Matching**
   - ML-based algorithm
   - Preference-based filtering
   - Location-based matching

3. **Media Handling**
   - Image upload
   - Photo compression
   - Video support

### Phase 3: Production Ready
1. **Performance**
   - Code splitting
   - Lazy loading
   - Image optimization
   - PWA support

2. **Security**
   - Input validation
   - XSS protection
   - Rate limiting
   - Content moderation

3. **Analytics**
   - User behavior tracking
   - Performance monitoring
   - Error logging

---

## 🐛 Debugging

### Common Issues

#### Port Already in Use
```bash
# Kill process on port 5173
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5173 | xargs kill
```

#### Hot Reload Not Working
- Clear browser cache
- Restart dev server
- Check for syntax errors in console

#### Mobile Not Connecting
- Check firewall settings
- Ensure same Wi-Fi network
- Try IP address instead of localhost

### Debug Tools
- React DevTools browser extension
- Vite DevTools
- Browser console
- Network tab for API calls

---

## 📚 Code Style Guidelines

### Naming Conventions
- **Components**: PascalCase (`Home.jsx`, `BottomNav.jsx`)
- **Functions**: camelCase (`handleSwipe`, `calculateCompatibility`)
- **Constants**: UPPER_SNAKE_CASE (`STORAGE_KEYS`, `ACTIVITY_TYPES`)
- **CSS Variables**: kebab-case (`--primary-color`)

### Component Structure
```jsx
// 1. Imports
import { useState, useEffect } from 'react'

// 2. Component
const MyComponent = ({ prop1, prop2 }) => {
  // 3. State
  const [state, setState] = useState()
  
  // 4. Effects
  useEffect(() => {
    // ...
  }, [])
  
  // 5. Handlers
  const handleClick = () => {
    // ...
  }
  
  // 6. Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}

// 7. Export
export default MyComponent
```

### Best Practices
- ✅ Use functional components with hooks
- ✅ Keep components small and focused
- ✅ Extract reusable logic into utilities
- ✅ Use meaningful variable names
- ✅ Add comments for complex logic
- ✅ Handle edge cases and errors
- ❌ Avoid inline functions in render (use useCallback)
- ❌ Don't mutate state directly
- ❌ Avoid deep nesting (>3 levels)

---

## 🔗 Useful Resources

### Documentation
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Supabase Docs](https://supabase.com/docs)

### Tools
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Vite DevTools](https://github.com/webfansplz/vite-plugin-vue-devtools)

### Design
- [Untitled UI Icons](https://www.untitledui.com/free-icons)
- [Google Fonts](https://fonts.google.com)

---

## 📝 Development Checklist

Before committing:
- [ ] Code follows style guidelines
- [ ] No console errors
- [ ] Works on mobile devices
- [ ] No linting errors
- [ ] Tested all new features
- [ ] Updated documentation if needed

---

## 💡 Tips & Tricks

### General Development Tips

1. **Use React DevTools** to inspect component state
2. **Check Network tab** for API calls
3. **Test on real devices** for accurate mobile experience
4. **Use Git** for version control
5. **Write comments** for complex logic
6. **Keep components small** and focused
7. **Reuse components** when possible
8. **Test edge cases** (empty states, errors, etc.)

### Performance Tips

9. **Optimize Images**
   - Use WebP format when possible
   - Compress images before adding to project
   - Lazy load images below the fold
   - Use `loading="lazy"` attribute for images

10. **Minimize Re-renders**
    - Use `React.memo()` for expensive components
    - Memoize callbacks with `useCallback()`
    - Memoize computed values with `useMemo()`
    - Check unnecessary re-renders with React DevTools Profiler

11. **Code Splitting**
    - Lazy load routes: `const Home = lazy(() => import('./pages/Home'))`
    - Split large components into smaller chunks
    - Use dynamic imports for heavy libraries

12. **Bundle Size**
    - Check bundle size: `npm run build` then check `dist/`
    - Remove unused dependencies
    - Use tree-shaking friendly imports
    - Analyze bundle: `npm install -g vite-bundle-visualizer`

### Code Organization Tips

13. **File Structure**
    - Keep related files together
    - Use index files for cleaner imports
    - Group by feature, not by type (for larger projects)

14. **Component Patterns**
    - Extract repeated JSX into smaller components
    - Use composition over inheritance
    - Create custom hooks for reusable logic
    - Keep business logic separate from UI

15. **Naming Conventions**
    - Use descriptive names: `handleSwipeRight` not `handleSR`
    - Prefix boolean variables with `is`, `has`, `should`: `isLoading`, `hasMatches`
    - Use verbs for functions: `calculateCompatibility`, `saveMatch`
    - Use nouns for components: `MatchCard`, `ProfileHeader`

### State Management Tips

16. **localStorage Best Practices**
    - Always wrap in try-catch blocks
    - Check if localStorage is available (private browsing)
    - Use the utility functions in `src/utils/localStorage.js`
    - Clear old data periodically to avoid quota issues

17. **State Updates**
    - Use functional updates: `setCount(prev => prev + 1)`
    - Batch state updates when possible
    - Avoid state updates in render functions
    - Use `useEffect` dependencies correctly

18. **Activity Tracking**
    - Use `trackActivity()` from `activityTracker.js` for user actions
    - Don't track too frequently (use debouncing)
    - Check `getInsights()` for analytics data

### UI/UX Tips

19. **Touch Interactions**
    - Minimum touch target: 44x44px
    - Add visual feedback on touch (scale, color change)
    - Use `onTouchStart` for instant feedback
    - Prevent default on touch events when needed

20. **Animations**
    - Keep animations under 300ms for interactions
    - Use CSS transforms for better performance
    - Add `will-change` property for animated elements
    - Test animations on lower-end devices

21. **Loading States**
    - Always show loading indicators
    - Use skeleton screens for better UX
    - Handle empty states gracefully
    - Show error states with retry options

22. **Responsive Design**
    - Test on multiple screen sizes
    - Use CSS variables for consistent spacing
    - Test in portrait and landscape
    - Check safe areas (notches, status bars)

### Testing Tips

23. **Manual Testing Checklist**
    - Test all swipe directions (left, right, up, down)
    - Test photo gallery swiping
    - Test match animations
    - Test undo functionality
    - Test filters and search
    - Test on slow network (throttle in DevTools)

24. **Browser Testing**
    - Test in Chrome, Firefox, Safari, Edge
    - Test on iOS Safari (different behavior)
    - Test on Android Chrome
    - Check console for errors/warnings

25. **Edge Cases**
    - Empty profile list
    - No matches found
    - Network errors
    - localStorage quota exceeded
    - Very long names/bios
    - Special characters in input

### Git Workflow Tips

26. **Commit Messages**
    - Use clear, descriptive messages
    - Follow conventional commits: `feat:`, `fix:`, `refactor:`
    - Example: `feat: add super like feature`

27. **Branch Strategy**
    - Create feature branches: `git checkout -b feature/super-like`
    - Keep main branch stable
    - Test before merging
    - Use pull requests for code review

28. **Git Best Practices**
    - Commit often, push regularly
    - Don't commit `node_modules/` or `.env` files
    - Use `.gitignore` properly
    - Write meaningful commit messages

### Productivity Tips

29. **VS Code Extensions**
    - ES7+ React/Redux/React-Native snippets
    - Prettier (code formatter)
    - ESLint (code linting)
    - Auto Rename Tag
    - Bracket Pair Colorizer

30. **Keyboard Shortcuts**
    - `Ctrl/Cmd + D`: Select next occurrence
    - `Ctrl/Cmd + Shift + L`: Select all occurrences
    - `Alt + Up/Down`: Move line
    - `Ctrl/Cmd + /`: Toggle comment
    - `F2`: Rename symbol

31. **Code Snippets**
    - Create custom snippets for repeated patterns
    - Use React snippets: `rafce` (arrow function export)
    - Use `useState` snippet: `us` + Tab

32. **Debugging Shortcuts**
    - `console.log()` with labels: `console.log('🔍 State:', state)`
    - Use `debugger;` statement for breakpoints
    - Use React DevTools Profiler for performance
    - Use Network tab throttling for slow connections

### Project-Specific Tips

33. **Working with Profiles**
    - Edit `src/data/datingProfiles.js` to add test profiles
    - Use realistic data for better testing
    - Test with various profile lengths
    - Test with missing optional fields

34. **Swipe Gestures**
    - Test swipe sensitivity in `Home.jsx`
    - Adjust thresholds: `threshold = 60` (line ~153)
    - Adjust velocity: `velocityThreshold = 500`
    - Test on different devices (touch sensitivity varies)

35. **Match System**
    - Match rate is currently 30% (line ~130 in Home.jsx)
    - Adjust `Math.random() > 0.7` to change match probability
    - Test match animations
    - Check match storage in localStorage

36. **Photo Gallery**
    - Photos are in `datingProfiles[].photos` array
    - Test with 1, 2, 3+ photos
    - Test photo swiping vs card swiping
    - Ensure photo indicators work correctly

37. **Activity Tracking**
    - Activities stored in localStorage (max 1000 entries)
    - Check `getInsights()` for user analytics
    - Activities tracked: likes, passes, searches, views
    - Use for building recommendation engine

### Troubleshooting Tips

38. **Swipe Not Working**
    - Check if `isDragging` state is set correctly
    - Verify touch event handlers are attached
    - Check for event propagation issues
    - Test on different browsers

39. **Match Animation Not Showing**
    - Check `showMatchAnimation` state
    - Verify match detection logic (line ~130)
    - Check console for errors
    - Ensure `matchedProfile` is set

40. **localStorage Issues**
    - Check browser console for quota errors
    - Clear localStorage: `localStorage.clear()`
    - Check if in private/incognito mode
    - Verify storage keys in `localStorage.js`

41. **Performance Issues**
    - Check React DevTools Profiler
    - Look for unnecessary re-renders
    - Check bundle size
    - Use Chrome DevTools Performance tab

### Advanced Tips

42. **Custom Hooks**
    - Create `useSwipe.js` for swipe logic
    - Create `useMatch.js` for match logic
    - Create `useLocalStorage.js` for storage
    - Reuse across components

43. **Error Boundaries**
    - Add error boundaries for better error handling
    - Catch React errors gracefully
    - Show user-friendly error messages
    - Log errors for debugging

44. **Accessibility**
    - Add ARIA labels to buttons
    - Ensure keyboard navigation works
    - Test with screen readers
    - Maintain color contrast ratios

45. **SEO & Meta Tags**
    - Update `index.html` meta tags
    - Add Open Graph tags for social sharing
    - Add favicon
    - Add manifest.json for PWA

### Supabase Migration Tips

46. **Preparing for Supabase**
    - Keep localStorage utilities as fallback
    - Create API service layer
    - Use environment variables for config
    - Plan database schema early

47. **Migration Strategy**
    - Migrate one feature at a time
    - Keep localStorage as backup
    - Test thoroughly before removing localStorage
    - Add migration scripts for existing data

### Quick Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Git
git status               # Check status
git add .                # Stage all changes
git commit -m "message"  # Commit changes
git push                 # Push to remote

# Debugging
# Open browser console (F12)
# React DevTools (install extension)
# Network tab for API calls
```

### Pro Tips

48. **Use Emojis in Console**
    - Makes logs easier to find: `console.log('🎯 Match:', match)`
    - Use different emojis for different log types
    - Filter logs by emoji in console

49. **Component Documentation**
    - Add JSDoc comments to complex functions
    - Document props with PropTypes or TypeScript
    - Add examples in comments

50. **Regular Cleanup**
    - Remove unused imports
    - Delete unused files
    - Clean up console.logs before commit
    - Update dependencies regularly: `npm outdated`

51. **Stay Updated**
    - Check React release notes
    - Follow Vite updates
    - Keep dependencies updated
    - Read Supabase changelog

52. **Code Review Checklist**
    - Does it work as expected?
    - Are there any console errors?
    - Is the code readable?
    - Are edge cases handled?
    - Is it performant?
    - Are there security concerns?

---

## 🆘 Getting Help

1. Check console for errors
2. Review this guide
3. Check React/Vite documentation
4. Search for similar issues online
5. Ask in development communities

---

## 📋 Quick Reference

### Common Code Patterns

#### Swipe Handler Pattern
```jsx
const handleTouchStart = (e) => {
  setIsDragging(true)
  setStartX(e.touches[0].clientX)
  setStartTime(Date.now())
}

const handleTouchMove = (e) => {
  if (!isDragging) return
  const deltaX = e.touches[0].clientX - startX
  setCurrentX(deltaX)
}

const handleTouchEnd = () => {
  if (!isDragging) return
  setIsDragging(false)
  if (Math.abs(currentX) > threshold) {
    handleSwipe(currentX > 0 ? 'right' : 'left')
  } else {
    setCurrentX(0) // Snap back
  }
}
```

#### localStorage Pattern
```jsx
import { saveMatches, getMatches } from '../utils/localStorage'

// Save
const matches = getMatches()
saveMatches([...matches, newMatch])

// Get
const matches = getMatches()
```

#### Activity Tracking Pattern
```jsx
import { trackActivity, ACTIVITY_TYPES } from '../utils/activityTracker'

trackActivity(ACTIVITY_TYPES.FAVORITE_ADDED, {
  id: profile.id,
  title: profile.name,
})
```

#### Icon Usage Pattern
```jsx
import { HeartIcon, StarIcon } from '../components/Icons'

<HeartIcon size={24} filled={true} />
<StarIcon size={20} className="custom-class" />
```

#### Button with Touch Feedback
```jsx
<button
  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
  style={{ transition: 'transform 0.1s' }}
>
  Click Me
</button>
```

#### CSS Variable Usage
```jsx
style={{
  background: 'var(--gradient-primary)',
  color: 'var(--text-primary)',
  boxShadow: 'var(--shadow-lg)',
}}
```

#### Loading State Pattern
```jsx
const [isLoading, setIsLoading] = useState(true)

useEffect(() => {
  setIsLoading(true)
  // Fetch data
  fetchData().then(() => setIsLoading(false))
}, [])

if (isLoading) return <LoadingSkeleton />
```

#### Empty State Pattern
```jsx
if (items.length === 0) {
  return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
      <h3>No items found</h3>
      <p>Try adjusting your filters</p>
    </div>
  )
}
```

### File Locations Quick Reference

| What | Where |
|------|-------|
| Add new page | `src/pages/YourPage.jsx` |
| Add new component | `src/components/YourComponent.jsx` |
| Add new icon | `src/components/Icons.jsx` |
| Modify colors | `src/index.css` (CSS variables) |
| Add mock data | `src/data/datingProfiles.js` |
| Storage utilities | `src/utils/localStorage.js` |
| Activity tracking | `src/utils/activityTracker.js` |
| App routing | `src/App.jsx` (renderContent) |
| Navigation | `src/components/BottomNav.jsx` |

### CSS Variables Quick Reference

```css
/* Colors */
--primary-color: #7c3aed
--secondary-color: #ec4899
--text-primary: #0f172a
--text-secondary: #64748b

/* Gradients */
--gradient-primary: linear-gradient(135deg, #7c3aed 0%, #a78bfa 50%, #ec4899 100%)
--gradient-card: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)

/* Shadows */
--shadow: 0 1px 3px rgba(0,0,0,0.1)
--shadow-lg: 0 10px 25px rgba(0,0,0,0.1)

/* Status Colors */
--success: #10b981
--error: #ef4444
--warning: #f59e0b
--info: #3b82f6
```

### Keyboard Shortcuts in App

- **Arrow Left / A**: Pass (swipe left)
- **Arrow Right / D**: Like (swipe right)
- **U**: Undo last swipe (if implemented)

### Common Issues & Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| Port in use | Change port in `vite.config.js` or kill process |
| Hot reload broken | Restart dev server |
| localStorage error | Check private browsing mode |
| Swipe not working | Check event handlers and state |
| Match not showing | Check match detection logic (30% chance) |
| Photos not loading | Check image URLs in `datingProfiles.js` |

### Performance Checklist

- [ ] Images optimized and compressed
- [ ] No unnecessary re-renders
- [ ] Code split for large components
- [ ] Lazy load routes
- [ ] Memoize expensive computations
- [ ] Use CSS transforms for animations
- [ ] Test on slow network (throttle)
- [ ] Check bundle size

### Before Deploying Checklist

- [ ] Run `npm run build` successfully
- [ ] Test production build with `npm run preview`
- [ ] Check all features work
- [ ] Test on mobile devices
- [ ] Remove console.logs
- [ ] Check for errors in console
- [ ] Optimize images
- [ ] Update meta tags in `index.html`
- [ ] Test on multiple browsers
- [ ] Check performance metrics

---

Happy Coding! 🚀
