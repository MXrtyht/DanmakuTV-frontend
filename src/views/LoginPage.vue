<script setup lang='ts'>
import axios from 'axios';
import { reactive } from 'vue';
import Logo from '../assets/Logo.png';
import { defineStore } from 'pinia'


const form = reactive({
    phone: '',
    password: '',
})

const loginUser = async () => {
    try {
        const response = await axios.post('http://localhost:8081/user/login', {
            phone: form.phone,
            password: form.password
        });

        console.log('登录成功:', response.data);
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            console.error('注册失败:', error.response.data.message);
        } else if (error instanceof Error) {
            console.error('请求失败:', error.message);
        } else {
            console.error('请求失败: 未知错误');
        }
    }
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
                                <el-button style="width: 100%;">注册</el-button>
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