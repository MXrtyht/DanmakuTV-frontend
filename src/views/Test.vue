<template>
    <div class="login">
        <div class="login-wrapper">
            <div class="login-header" :style="isMiniWidth ? `transform: scale(${zoom});` : ''">
                <h2>Administrator</h2>
            </div>
            <div class="login-container">
                <div class="form-box">
                    <div class="input-box">
                        <i class="iconfont icon-zhanghao"></i>
                        <input type="text" v-model="username">
                        <label :class="username.length != 0 ? 'label-up' : ''">账号</label>
                    </div>
                    <div class="input-box">
                        <i class="iconfont icon-mima"></i>
                        <input type="password" v-model="password">
                        <label :class="password.length != 0 ? 'label-up' : ''">密码</label>
                    </div>
                </div>
            </div>
        </div>        
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { ElMessage } from 'element-plus';

// 状态定义
const username = ref('');
const password = ref('');
const isMiniWidth = ref(false);
const zoom = ref(1);

const router = useRouter();

// 粒子参数
const options = {
  background: {
  },
  particles: {
    number: {
      value: 60,
      density: {
        enable: true,
        value_area: 631.3280775270874
      }
    },
    color: { value: "#fff" },
    shape: {
      type: "circle",
      stroke: { width: 0, color: "#000000" },
      polygon: { nb_sides: 5 },
      image: { src: "img/github.svg", width: 100, height: 100 }
    },
    opacity: {
      value: 0.7,
      random: true,
      anim: { enable: false, speed: 1, opacity_min: 0.1, sync: false }
    },
    size: {
      value: 5,
      random: true,
      anim: { enable: false, speed: 40, size_min: 0.1, sync: false }
    },
    line_linked: {
      enable: false,
      distance: 500,
      color: "#ffffff",
      opacity: 0.4,
      width: 2
    },
    move: {
      enable: true,
      speed: 1.5,
      direction: "bottom",
      random: false,
      straight: false,
      out_mode: "out",
      bounce: false,
      attract: {
        enable: false,
        rotateX: 600,
        rotateY: 1200
      }
    }
  },
  interactivity: {
    detect_on: "canvas",
    events: {
      onhover: { enable: false, mode: "bubble" },
      onclick: { enable: true, mode: "repulse" },
      resize: true
    },
    modes: {
      grab: { distance: 400, line_linked: { opacity: 0.5 } },
      bubble: { distance: 400, size: 4, duration: 0.3, opacity: 1, speed: 3 },
      repulse: { distance: 200, duration: 0.4 },
      push: { particles_nb: 4 },
      remove: { particles_nb: 2 }
    }
  },
  retina_detect: true
};

// 登录方法
const login = async () => {
  if (!username.value) {
    ElMessage.error("请输入账号");
    return;
  }
  if (!password.value) {
    ElMessage.error("请输入密码");
    return;
  }

  store.state.isLoading = true;

  let result = null;
  try {
    result = await axios.post('/api/admin/account/login', {
      username: username.value,
      password: password.value,
    });
  } catch {
    ElMessage.error("用户名或密码错误");
    store.state.isLoading = false;
    return;
  }

  if (!result || result.data.code !== 200) {
    ElMessage.error(result?.data?.message || "登录失败");
    store.state.isLoading = false;
    return;
  }

  // 登录成功
  localStorage.setItem("user_token", result.data.data.token);
  store.commit("updateUser", result.data.data.user);
  store.commit("updateIsLogin", true);
  ElMessage.success(result.data.message);
  router.push("/");
  store.state.isLoading = false;
};

// 判断窗口大小
const changeWidth = () => {
  if (window.innerWidth < 444) {
    zoom.value = (window.innerWidth * 0.9) / 400;
    isMiniWidth.value = true;
  } else {
    isMiniWidth.value = false;
  }
};

// 初始化粒子特效
const particlesInit = async (engine) => {
  await loadFull(engine);
};

// 生命周期
onMounted(() => {
  changeWidth();
  window.addEventListener('resize', changeWidth);
});

onUnmounted(() => {
  window.removeEventListener('resize', changeWidth);
});
</script>


<style scoped>
.login-wrapper {
    position: absolute;
    width: 400px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    backdrop-filter: blur(15px);
    box-shadow: 0px 0px 30px rgba(0, 0, 0, 0.5);
}

.login-header {
    position: relative;
}

.login-header h2 {
    position: absolute;
    top: -70px;
    left: 50%;
    font-weight: 600;
    transform: translateX(-50%);
    font-size: 3em;
    color: #fff;
    text-shadow: 0 10px 15px rgb(0, 0, 0);
}

.login-container {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
}

.form-box {
    width: 100%;
    padding: 10px 40px 40px 40px;
}

.input-box {
    position: relative;
    width: 100%;
    height: 50px;
    border-bottom: 2px solid #162938;
    margin: 30px 0;
}

.input-box label {
    position: absolute;
    top: 50%;
    left: 5px;
    transform: translateY(-50%);
    font-size: 1em;
    color: #162938;
    pointer-events: none;
    transition: .5s;
}

.input-box input:focus~label, .label-up {
    top: -5px !important;
}

.input-box input {
    width: 100%;
    height: 100%;
    background: transparent;
    border: none;
    outline: none;
    font-size: 1em;
    color: #162938;
    font-weight: 600;
    padding: 0 35px 0 5px;
}

.input-box .iconfont {
    position: absolute;
    right: 0px;
    padding-right: 8px;
    font-size: 1.2em;
    color: #162938;
    line-height: 48px;
}

.login-btn {
    width: 100%;
    height: 45px;
    border-radius: 6px;
    font-size: 1.1em;
}

.tips {
    font-size: .9em;
    color: rgb(31, 61, 84);
    margin-top: 20px;
}

.tips a {
    cursor: pointer;
    color: var(--Pi6_u);
    text-decoration: none;
}

.tips a:hover {
    text-decoration: underline;
}

@media (max-width: 444px) {
    .form-box {
        padding: 10px 40px 20px 40px;
    }

    .login-wrapper {
        width: 90vw;
    }

    .input-box {
        margin: 18px 0;
        height: 40px;
    }
    
    .login-btn {
        height: 40px;
    }
}
</style>