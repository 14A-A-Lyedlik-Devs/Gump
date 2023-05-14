export const emptyIngredient: Ingredient = {
  name: '',
  value: 0,
  volume: '',
  linkedRecipe: 0,
}

export const emptyRecipe: Recipe = {
  id: 0,
  title: '',
  author: 0,
  image: 0,
  language: '',
  serves: 0,
  categories: [],
  tags: [],
  ingredients: [],
  steps: [],
  viewCount: 0,
  isSaved: false,
  saveCount: 0,
  isLiked: false,
  likeCount: 0,
  referenceCount: 0,
  isArchived: false,
  isOriginal: false,
  originalRecipe: 0,
  isPrivate: false,
  forks: [],
  visibleTo: [],
}

export const useRecipeStore = defineStore('recipe', {
  state: () => ({
    recipes: [] as Recipe[],
    searchRecipes: [] as SearchRecipe[],
    ingredients: [] as Ingredient[],
    currentRecipe: undefined as Recipe | undefined,
    cachedRecipes: {} as Record<Sort, Recipe[]>,
  }),
  getters: {
    getEmptyIngredients(): Ingredient[] {
      return this.ingredients.filter(ingredient => ingredient.name === '' && !ingredient.value && ingredient.volume === '')
    },
  },
  actions: {
    async getRecipes(sort: Sort): Promise<Recipe[] | undefined> {
      if (this.cachedRecipes && !this.cachedRecipes[sort]) {
        this.cachedRecipes[sort] = []
      } else {
        if (this.cachedRecipes[sort].length > 0) {
          this.recipes = this.cachedRecipes[sort]
          return this.recipes
        }
      }

      const { data, error } = await gumpFetch<Recipe[]>(`recipe/search?sort=${sort}`, {
        headers: {},
        method: 'GET',
      }).json()
      if (data.value) {
        this.cachedRecipes[sort] = data.value
        this.recipes = data.value
        return this.recipes
      }

      if (error.value)
        return error.value
    },
    addEmptyIngredient(id?: number) {
      this.currentRecipe?.ingredients.push({
        name: '',
        value: 0,
        volume: '',
        linkedRecipe: id || 0,
      })
    },
    addEmptyStep(index?: number) {
      if (this.currentRecipe) {
        if (index !== undefined)
          this.currentRecipe.steps.splice(index + 1, 0, '')
        else
          this.currentRecipe.steps.push('')
      } else {
        this.currentRecipe = emptyRecipe
        this.currentRecipe.steps.push('')
      }
    },
    checkEmptyIngredients() {
      if (this.getEmptyIngredients.length > 0) {
        this.getEmptyIngredients.forEach((ingredient) => {
          const index = this.ingredients.indexOf(ingredient)
          if (index > -1)
            this.ingredients.splice(index, 1)
        })
      }
    },
    removeStep(index: number) {
      if (this.currentRecipe)
        this.currentRecipe.steps.splice(index, 1)
    },
    removeIngredient(index: number) {
      if (this.currentRecipe)
        this.currentRecipe.ingredients.splice(index, 1)
    },
    addRecipe(recipe: Recipe) {
      this.currentRecipe?.ingredients.push({
        name: recipe.title,
        value: 1,
        volume: 'piece',
        linkedRecipe: recipe.id,
      })
    },
    search(query: string): Recipe[] {
      return this.recipes.filter(recipe => recipe.title.toLowerCase().includes(query.toLowerCase()))
    },
    async likeRecipe(recipeId: number) {
      const { data, error } = await gumpFetch(`recipe/like/${recipeId}`, {
        method: 'PATCH',
      })
      if (data.value)
        return data.value

      if (error.value)
        return error.value
    },
    async saveRecipe(recipeId: number) {
      const { data, error } = await gumpFetch(`recipe/save/${recipeId}`, {
        method: 'PATCH',
      })
      if (data.value)
        return data.value

      if (error.value)
        return error.value
    },
    async getRecipeById(recipeId: number): Promise<Recipe | undefined> {
      const recipe = this.recipes.find(r => r.id === recipeId)
      if (recipe && recipe.ingredients) {
        return recipe
      } else {
        const { data, error } = await gumpFetch<Recipe>(`recipe/${recipeId}`, {
          headers: {},
          method: 'GET',
        }).json()
        if (data.value) {
          const user = useUserStore()

          data.value.isLiked = user.current.likes.includes(data.value.id)
          data.value.isSaved = user.current.recipes.includes(data.value.id)
          data.value.visibleTo = []

          if (recipe)
            this.recipes.splice(this.recipes.indexOf(recipe), 1, data.value)
          else
            this.recipes.push(data.value)

          // for every ingredient in the recipe, check if it has a non-zero linkedRecipe and call getRecipeById on them
          data.value.ingredients.forEach(async (ingredient: Ingredient) => {
            if (ingredient.linkedRecipe)
              await this.getRecipeById(ingredient.linkedRecipe)
          })

          return data.value
        }

        if (error.value)
          return error.value
      }
    },
    async createRecipe(recipe?: Optional<Recipe, 'id'>): Promise<void> {
      const user = useUserStore()
      const ui = useUIStore()
      if (ui.createHeaderStates.some(state => !state))
        return

      const thisRecipe = recipe || this.currentRecipe

      if (thisRecipe)
        delete thisRecipe.id

      if (thisRecipe) {
        thisRecipe.author = user.current.id

        const { data, error } = await gumpFetch('recipe/create', {
          body: JSON.stringify(thisRecipe),
        }).text().post()
        if (data.value) {
          const id = parseInt(data.value, 10)
          this.recipes.push({
            id,
            ...thisRecipe,
          })
          this.currentRecipe = emptyRecipe

          user.current.recipes.push(id)
          ui.createHeaderIndex = 0
          ui.createHeaderStates = [false, false, false, false]
        }

        if (error.value)
          return error.value
      }
    },
    async updateRecipe(id: number, recipe: Partial<Recipe>): Promise<void> {
      const { error } = await gumpFetch('recipe/update', {
        method: 'PATCH',
        body: JSON.stringify(recipe),
      })

      if (!error.value) {
        const foundRecipe = this.recipes.find(r => r.id === id)
        if (foundRecipe) {
          // update each changed property of the recipe with the new values
          Object.keys(recipe).forEach((prop) => {
            const key = prop as keyof Recipe
            if (foundRecipe[key] !== recipe[key])
              setValues(foundRecipe, key, recipe[key] as Recipe[keyof Recipe])
          })
        }
      }

      if (error.value)
        return error.value
    },
    async deleteRecipe(recipeId: number): Promise<void> {
      const { data, error } = await gumpFetch(`recipe/delete/${recipeId}`, {
        method: 'DELETE',
      })
      console.log(data.value)
      if (data.value) {
        const recipe = this.recipes.find(r => r.id === recipeId)
        if (recipe)
          this.recipes.splice(this.recipes.indexOf(recipe), 1)
      }

      if (error.value)
        return error.value
    },
  },
  persist: true,
})
