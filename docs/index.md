<div class="landing-page">

  <section class="hero-panel">
    <div class="hero-copy">
      <p class="hero-kicker">PERSONAL KNOWLEDGE GARDEN</p>
      <h1 class="hero-wordmark">
        <span>侧耳倾听</span>
        <span class="hero-clover">☘</span>
      </h1>
      <p class="hero-lead">
        把深度学习部署、C++ 工程实践和 Python 自动化笔记整理成一个可以慢慢翻阅的网站。
        首页只放精选入口，分类、列表和文章详情都拆开了，读起来会更轻一些。
      </p>
      <div class="hero-actions">
        <a class="hero-button hero-button-primary" href="categories/">进入分类</a>
        <a class="hero-button" href="latest/">查看最新文章</a>
      </div>
    </div>
    <div class="hero-note">
      <p class="hero-note-title">本次重构</p>
      <ul>
        <li>首页、分类、最新文章、关于拆成独立页面</li>
        <li>分类页可继续点入列表页</li>
        <li>文章卡片宽度与分类卡片保持一致</li>
        <li>所有文章都能进入独立详情页</li>
      </ul>
    </div>
  </section>

  <section class="section-block">
    <div class="section-heading">
      <p class="section-eyebrow">CATEGORIES</p>
      <h2>文章分类</h2>
    </div>
    <div class="card-grid card-grid-three">
      <a class="site-card" href="categories/deploy/">
        <p class="site-card-kicker">DL DEPLOY</p>
        <h3>深度学习部署</h3>
        <p>TensorRT、量化、剪枝、知识蒸馏与上线过程中的性能优化。</p>
      </a>
      <a class="site-card" href="categories/cpp/">
        <p class="site-card-kicker">C++ ENGINEERING</p>
        <h3>C++ 工程实践</h3>
        <p>从内存布局到并发模型，把底层细节整理成更容易回看的工程笔记。</p>
      </a>
      <a class="site-card" href="categories/python/">
        <p class="site-card-kicker">PYTHON AUTOMATION</p>
        <h3>Python 自动化</h3>
        <p>围绕脚本工具、数据处理和实验流程，把重复劳动做成稳定工具链。</p>
      </a>
    </div>
  </section>

  <section class="section-block">
    <div class="section-heading">
      <p class="section-eyebrow">LATEST</p>
      <h2>最新文章</h2>
    </div>
    <div class="card-grid card-grid-three">
      <a class="site-card" href="articles/python/experiment-tracker/">
        <p class="site-card-kicker">2026-03-30</p>
        <h3>实验记录脚本的最小闭环</h3>
        <p>用 Python 把实验参数、日志和结果统一收口，避免回头找不到版本。</p>
      </a>
      <a class="site-card" href="notes/tensorrt-intro/">
        <p class="site-card-kicker">2026-03-30</p>
        <h3>TensorRT 简介</h3>
        <p>梳理 TensorRT 的定位、量化能力和常见硬件适配注意点。</p>
      </a>
      <a class="site-card" href="articles/cpp/cache-friendly-vector/">
        <p class="site-card-kicker">2026-03-29</p>
        <h3>Cache Friendly 的结构体设计</h3>
        <p>从缓存命中率出发，重新看待 AoS 与 SoA 在 C++ 项目里的取舍。</p>
      </a>
      <a class="site-card" href="notes/quantization/">
        <p class="site-card-kicker">2026-03-29</p>
        <h3>量化技术详解</h3>
        <p>从低比特表示出发，整理模型量化在速度和体积上的实际收益。</p>
      </a>
      <a class="site-card" href="articles/deploy/triton-rollout-checklist/">
        <p class="site-card-kicker">2026-03-28</p>
        <h3>Triton 上线检查清单</h3>
        <p>把模型服务上线前的输入输出、资源和观测项检查成一张清单。</p>
      </a>
      <a class="site-card" href="notes/network-pruning/">
        <p class="site-card-kicker">2026-03-28</p>
        <h3>模型剪枝笔记</h3>
        <p>剪枝不是终点，部署性能、精度回归和算子兼容同样需要一起看。</p>
      </a>
    </div>
  </section>

  <section class="section-block">
    <div class="section-heading">
      <p class="section-eyebrow">ABOUT</p>
      <h2>关于</h2>
    </div>
    <div class="card-grid card-grid-three">
      <a class="site-card" href="about/">
        <p class="site-card-kicker">ABOUT THE SITE</p>
        <h3>为什么写这个网站</h3>
        <p>把零散的技术备忘录整理成可浏览、可跳转、可沉淀的长期知识花园。</p>
      </a>
    </div>
  </section>

</div>
