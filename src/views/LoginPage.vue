<script setup lang='ts'>
import axios from 'axios';
import { ElMessageBox } from 'element-plus';
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import Logo from '../assets/Logo.png';
import { useAuthStore } from '../stores/authentication';
import { encryptKey } from '../utils/jsencryptKey';

const BASE_URL = import.meta.env.VITE_USER_SERVICE_BASE_API;

const router = useRouter();
const publicKey = ref<string>('')

const form = reactive({
    phone: '',
    password: '',
})

const getPubliKey = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/user/rsa-pks`);
        if (response.data.code === 200 && response.data.data) {
            publicKey.value = response.data.data;
        } else {
            throw new Error('获取公钥失败');
        }
    } catch (err) {
        console.error('无法获取公钥:', err);
    }
}

const loginUser = async () => {
    try {
        // 先获取公钥
        if (!publicKey.value) {
            await getPubliKey();
        }

        // 用公钥加密密码
        const encryptedPassword = encryptKey(form.password, publicKey.value)

        // 发送登录请求
        const response = await axios.post(
            `${BASE_URL}/user/login`,
            {
                phone: form.phone,
                password: encryptedPassword
            }
        );

        if (response.data.code === 200 && response.data.data) {
            console.log('登录成功:', response.data.data);
            // 用pinia保存用户token
            const authStore = useAuthStore();
            authStore.setToken(response.data.data);

            // 登录成功后跳转到index页面
            router.push('/index');
        } else {
            // 登录失败
            throw new Error(response.data.message || '登录失败');
        }
    } catch (error: unknown) {
        console.error('登录失败:', error);
        await showLoginFailureDialog('登录失败，请检查账号密码后重试');
        clearForm();
    }
}

// 显示登录失败对话框
const showLoginFailureDialog = async (message: string) => {
    try {
        await ElMessageBox.alert(message, '登录失败', {
            confirmButtonText: '确定',
            type: 'error',
            center: true
        });
    } catch {
        // 用户关闭对话框
    }
}

// 清空表单
const clearForm = () => {
    form.phone = '';
    form.password = '';
}
</script>

<template>
    <div class="login">
        <div class="login-form">
            <el-header style="margin-bottom: 40px;">
                <div>
                    <el-image style="width: 174px; height: 94px" :src="Logo" />
                </div>
            </el-header>
            <el-container>
                <el-aside style="width: 30em;">
                    <div style="text-align: left; padding-left:20px">
                        <h2>登录</h2>
                        <span>继续访问Danmaku-TV</span>
                    </div>
                </el-aside>
                <el-main>
                    <el-form :model="form" label-width="auto" size="large">
                        <el-form-item>
                            <el-input placeholder='手机号码' v-model="form.phone" />
                        </el-form-item>
                        <el-form-item>
                            <el-input show-password placeholder='密码' v-model="form.password" />
                        </el-form-item>
                        <el-row :gutter="0">
                            <el-col :span="6" :offset="9">
                                <router-link to="/register">
                                    <el-button style="width: 100%;">注册</el-button>
                                </router-link>
                            </el-col>
                            <el-col :span="6" :offset="3">
                                <el-button style="width: 100%;" type="primary" @click="loginUser">登录</el-button>
                            </el-col>
                        </el-row>
                    </el-form>
                </el-main>
            </el-container>
        </div>
    </div>
</template>

<style scoped>
.login {
    position: absolute;
    top: 40%;
    left: 50%;
    transform: translate(-50%, -50%);

    display: flex;
    justify-content: center;
    align-items: center;

    background-color: #ffffff;
}

.login-form {
    min-width: 60em;
    padding: 1em;
    border: 2px solid #c6e2ff;
    border-radius: 20px;
}
</style>
