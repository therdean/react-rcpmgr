import React, { useState, useEffect, createContext, useContext } from 'react';
import { ChefHat, Clock, TrendingUp, Globe, LogOut, Edit2, Trash2, Plus, X, Save } from 'lucide-react';

// Auth Context
const AuthContext = createContext(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUsername = localStorage.getItem('username');
    if (savedToken && savedUsername) {
      setUser({ username: savedUsername, token: savedToken });
    }
  }, []);

  const login = (username, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    setUser({ username, token });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const API_URL = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL : 'http://springboot-rcpmgr-service:8080'

// Login Component (Admin Only)
const LoginModal = ({ onLogin, onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Validate inputs
    if (!username.trim()) {
      setError('Username is required.');
      return;
    }
    if (!password.trim()) {
      setError('Password is required.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Invalid credentials');
      }

      const data = await response.json();
      onLogin(data.username, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <ChefHat className="w-12 h-12 text-orange-500" />
            <h1 className="text-2xl font-bold text-gray-800">Admin Login</h1>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <p className="text-gray-600 mb-6 text-sm">
          Login to edit and manage recipes
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="admin"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="admin"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Please wait...' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Recipe Form Component
const RecipeForm = ({ recipe, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: recipe?.name || '',
    cuisine: recipe?.cuisine || '',
    prepTime: recipe?.prepTime || '',
    difficulty: recipe?.difficulty || 'Easy',
    ingredients: recipe?.ingredients?.join('\n') || '',
    instructions: recipe?.instructions?.join('\n') || ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setError('');

    // Validate form
    if (!formData.name.trim()) {
      setError('Recipe name is required');
      return;
    }
    if (!formData.cuisine.trim()) {
      setError('Cuisine is required');
      return;
    }
    if (!formData.prepTime || formData.prepTime < 1) {
      setError('Prep time must be at least 1 minute');
      return;
    }
    if (!formData.ingredients.trim()) {
      setError('Ingredients are required');
      return;
    }
    if (!formData.instructions.trim()) {
      setError('Instructions are required');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...formData,
        prepTime: parseInt(formData.prepTime),
        ingredients: formData.ingredients.split('\n').filter(i => i.trim()),
        instructions: formData.instructions.split('\n').filter(i => i.trim())
      });
    } catch (err) {
      setError(err.message || 'Failed to save recipe');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-orange-400 to-red-400 p-6 text-white flex justify-between items-center">
          <h2 className="text-2xl font-bold">{recipe ? 'Edit Recipe' : 'Add New Recipe'}</h2>
          <button onClick={onCancel} className="hover:bg-white hover:bg-opacity-20 p-2 rounded">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipe Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine</label>
              <input
                type="text"
                value={formData.cuisine}
                onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prep Time (min)</label>
              <input
                type="number"
                value={formData.prepTime}
                onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ingredients (one per line)
            </label>
            <textarea
              value={formData.ingredients}
              onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 h-32"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instructions (one per line)
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 h-32"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Recipe'}
            </button>
            <button
              onClick={onCancel}
              disabled={saving}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Recipe App
const RecipeApp = () => {
  const { user, login, logout } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/recipes`);
      if (!response.ok) throw new Error('Failed to fetch recipes');
      const data = await response.json();
      setRecipes(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const saveRecipe = async (recipeData) => {
    try {
      const url = editingRecipe
        ? `${API_URL}/api/recipes/${editingRecipe.id}`
        : `${API_URL}/api/recipes`;

      const response = await fetch(url, {
        method: editingRecipe ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(recipeData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to save recipe');
      }

      await fetchRecipes();
      setEditingRecipe(null);
      setIsAddingNew(false);
    } catch (err) {
      throw err; // Re-throw to be caught by RecipeForm
    }
  };

  const deleteRecipe = async (id) => {
    if (!window.confirm('Are you sure you want to delete this recipe?')) return;

    try {
      const response = await fetch(`${API_URL}/api/recipes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to delete recipe');
      }

      await fetchRecipes();
      setSelectedRecipe(null);
    } catch (err) {
      setError('Error deleting recipe: ' + err.message);
    }
  };

  const handleLoginSuccess = (username, token) => {
    login(username, token);
    setShowLoginModal(false);
  };

  const handleEditClick = (recipe) => {
    if (!user) {
      setShowLoginModal(true);
    } else {
      setEditingRecipe(recipe);
    }
  };

  const handleAddClick = () => {
    if (!user) {
      setShowLoginModal(true);
    } else {
      setIsAddingNew(true);
    }
  };

  const handleDeleteClick = async (id) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    await deleteRecipe(id);
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'Easy': 'bg-green-100 text-green-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'Hard': 'bg-red-100 text-red-800'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="w-16 h-16 text-orange-500 animate-bounce mx-auto mb-4" />
          <p className="text-xl text-gray-600">Loading recipes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <header className="bg-white shadow-sm border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChefHat className="w-8 h-8 text-orange-500" />
              <h1 className="text-3xl font-bold text-gray-800">Recipe Collection</h1>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-gray-600">Welcome, {user.username}!</span>
                  <button
                    onClick={handleAddClick}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Add Recipe
                  </button>
                  <button
                    onClick={logout}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Admin Login
                </button>
              )}
            </div>
          </div>
          {error && (
            <div className="mt-3 text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded">
              {error} - Make sure your backend is running
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {recipes.length === 0 ? (
          <div className="text-center py-16">
            <ChefHat className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-600 mb-2">No recipes yet</h2>
            <p className="text-gray-500 mb-6">Start by adding your first recipe.</p>
            <button
              onClick={handleAddClick}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Your First Recipe
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden border border-orange-100"
              >
                <div className="bg-gradient-to-r from-orange-400 to-red-400 h-32 flex items-center justify-center">
                  <ChefHat className="w-16 h-16 text-white" />
                </div>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-3">{recipe.name}</h2>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Globe className="w-4 h-4" />
                      <span className="text-sm">{recipe.cuisine}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{recipe.prepTime} minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-gray-600" />
                      <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(recipe.difficulty)}`}>
                        {recipe.difficulty}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedRecipe(recipe)}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg transition-colors"
                    >
                      View
                    </button>
                    {user && (
                      <>
                        <button
                          onClick={() => handleEditClick(recipe)}
                          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(recipe.id)}
                          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedRecipe(null)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-orange-400 to-red-400 p-6 text-white">
              <h2 className="text-3xl font-bold mb-2">{selectedRecipe.name}</h2>
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  {selectedRecipe.cuisine}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {selectedRecipe.prepTime} min
                </span>
                <span className="bg-white bg-opacity-20 px-2 py-1 rounded">
                  {selectedRecipe.difficulty}
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-3">Ingredients</h3>
                <ul className="space-y-2">
                  {selectedRecipe.ingredients.map((ingredient, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span className="text-gray-700">{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-3">Instructions</h3>
                <ol className="space-y-3">
                  {selectedRecipe.instructions.map((instruction, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-gray-700 pt-0.5">{instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <button
                onClick={() => setSelectedRecipe(null)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Add Recipe Form */}
      {(editingRecipe || isAddingNew) && (
        <RecipeForm
          recipe={editingRecipe}
          onSave={saveRecipe}
          onCancel={() => {
            setEditingRecipe(null);
            setIsAddingNew(false);
          }}
        />
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          onLogin={handleLoginSuccess}
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </div>
  );
};

// App wrapper with Auth Provider
const App = () => {
  return (
    <AuthProvider>
      <RecipeApp />
    </AuthProvider>
  );
};

export default App;