# Machine Learning & Recommendation Methodology

## 1. Feature Engineering
Each tourist profile $i$ is mapped into an 8-dimensional normalized continuous vector $\mathbf{x}_i \in \mathbb{R}^8$:
$$\mathbf{x}_i = [x_{nature}, x_{culture}, x_{adventure}, x_{relaxation}, x_{wildlife}, x_{heritage}, x_{budget}, x_{duration}]$$

- Continuous affinities $x \in [0.0, 1.0]$.
- Categorical budget band mapped ordinal:
  $$\text{Budget} \to 0.2, \quad \text{Moderate} \to 0.5, \quad \text{Luxury} \to 0.9$$
- Trip duration normalized:
  $$x_{duration} = \min\left(1.0, \frac{\text{duration\_days}}{10.0}\right)$$

### Feature Standardization
Features are standardized via z-score scaling:
$$z_{ij} = \frac{x_{ij} - \mu_j}{\sigma_j}$$
where $\mu_j$ and $\sigma_j$ denote empirical mean and sample standard deviation of feature $j$.

---

## 2. Unsupervised Tourist Behaviour Clustering

### 2.1 Algorithm
K-Means algorithm minimizes total within-cluster sum of squares (Inertia):
$$J(K) = \sum_{k=1}^K \sum_{\mathbf{z}_i \in S_k} \|\mathbf{z}_i - \boldsymbol{\mu}_k\|^2$$

Centroids are initialized using **K-Means++** probabilistic seeding to prevent poor local minima.

### 2.2 Hyperparameter Evaluation ($k \in [2, 7]$)
- **Elbow Criterion**: Tracking inertia reduction rate $\Delta J(k) = J(k) - J(k-1)$.
- **Silhouette Coefficient**:
  For sample $i$ belonging to cluster $A$:
  $$a(i) = \frac{1}{|A| - 1} \sum_{j \in A, j \neq i} \|\mathbf{z}_i - \mathbf{z}_j\|$$
  $$b(i) = \min_{C \neq A} \frac{1}{|C|} \sum_{j \in C} \|\mathbf{z}_i - \mathbf{z}_j\|$$
  $$s(i) = \frac{b(i) - a(i)}{\max(a(i), b(i))}, \quad s(i) \in [-1, 1]$$

### 2.3 Empirical Segment Label Derivation
Instead of arbitrary hardcoded designations, cluster centroids $\boldsymbol{\mu}_k$ are unscaled back to raw feature space and examined across dominant dimensions:
- Cluster 0: **Culture & Heritage Travellers** ($\mu_{culture} > 0.8$)
- Cluster 1: **Adventure & Trekking Seekers** ($\mu_{adventure} > 0.8, \mu_{nature} > 0.7$)
- Cluster 2: **Budget Urban & Street Explorers** ($\mu_{budget} \le 0.3$)
- Cluster 3: **Himalayan & Nature Explorers** ($\mu_{nature} > 0.85$)
- Cluster 4: **Coastal & Relaxation Vacationers** ($\mu_{relaxation} > 0.85$)

---

## 3. Multi-Criteria Hybrid Recommendation Engine

The composite recommendation score for user profile $\mathbf{u}$ and candidate destination $d$ is:
$$\text{Score}(\mathbf{u}, d) = w_1 \cdot \text{Sim}_{content}(\mathbf{u}, d) + w_2 \cdot \text{Affinity}_{cluster}(c_u, d) + w_3 \cdot \text{Match}_{season}(m, d) + w_4 \cdot \text{Signal}_{pop}(d)$$

Where:
1. **Content Cosine Similarity ($w_1 = 0.40$)**:
   $$\text{Sim}_{content}(\mathbf{u}, \mathbf{d}) = \frac{\mathbf{u} \cdot \mathbf{d}}{\|\mathbf{u}\| \|\mathbf{d}\|}$$
2. **Cluster Preference Affinity ($w_2 = 0.25$)**:
   $$\text{Affinity}_{cluster}(c_u, d) = \frac{\text{Visits}(c_u, d)}{\max_{d'} \text{Visits}(c_u, d')}$$
3. **Seasonality Matching ($w_3 = 0.15$)**:
   $$1.0 \text{ if } m \in \text{best\_months}(d) \text{ else } 0.5$$
4. **Logarithmic Popularity Bias Dampening ($w_4 = 0.20$)**:
   $$\text{Signal}_{pop}(d) = \frac{\ln(1 + \text{Popularity}_d)}{\ln(1 + 100)}$$
   Logarithmic compression prevents prominent mega-monuments from monopolizing recommendations, allowing high-affinity hidden gems to surface.
