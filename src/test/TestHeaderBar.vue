<script setup lang='ts'>
import axios from 'axios';
import { reactive,ref } from 'vue';
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import Logo from '../assets/Logo.png';
import { encryptKey } from '../utils/jsencryptKey';
import HeaderBar from '../components/headerBar/HeaderBar.vue';

const BASE_URL = import.meta.env.VITE_USER_SERVICE_BASE_API;

// 定义表单数据类型
interface RuleForm {
    phone: string,
    email: string,
    password: string,
    recheckPassword: string
}
const ruleFormRef = ref<FormInstance>()

const form = reactive<RuleForm>({
    phone: '',
    email: '',
    password: '',
    recheckPassword: ''
})

const rules = reactive<FormRules<RuleForm>>({
  phone:[
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号码格式不正确', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入电子邮箱', trigger: 'blur' },
    { type: 'email', message: '电子邮箱格式不正确', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ],
  recheckPassword: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
});

const registerUser = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  const valid = await formEl.validate();

  // 检查信息是否合法
  if(!valid) {
    ElMessage.error('请填写完整信息');
    return;
  }

  // 检查两次输入的密码是否一致
  if (form.password !== form.recheckPassword) {
    ElMessage.error('两次输入的密码不一致');
    return;
  }

  //流程
  //先调借口拿rsa公钥
  //密码用公钥加密再传
  try {

    // 获取公钥
    const RSAPassword=await axios.get(`${BASE_URL}/user/rsa-pks`);
    if(RSAPassword.data.code!=200){
      console.error('获取RSA公钥失败:'+ RSAPassword.data.message);
      ElMessage.error('获取RSA公钥失败:'+ RSAPassword.data.message);
      throw new Error('获取公钥失败');
    }

    if (!RSAPassword.data.data) {
      console.error('获取RSA公钥失败: 公钥数据为空');
      ElMessage.error('获取RSA公钥失败: 公钥数据为空');
      throw new Error('获取公钥失败');
    }

    // 用公钥加密密码
    const encryptedPassword = encryptKey(form.password, RSAPassword.data.data);

    // 发送注册请求
    const response = await axios.post(`${BASE_URL}/user/register`, {
        phone: form.phone,
        email: form.email,
        // 使用加密后的密码
        password: encryptedPassword
    });

    // 检查响应状态
    if (response.data.code !== 200) {
      console.error('注册失败:', response.data.message);
      ElMessage.error('注册失败:', response.data.message);
      return;
    }

    console.log('注册成功:', response.data);
    ElMessage.success('注册成功');

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
  <HeaderBar>
  </HeaderBar>
  <div class="register">
        <div class="register-form">
            <el-header style="margin-bottom: 40px;">
                <div>
                    <el-image style="width: 174px; height: 94px" :src="Logo" />
                </div>
            </el-header>
            <el-container>
                <el-aside style="width: 30em;">
                    <div style="text-align: left; padding-left:20px">
                        <h2>注册</h2>
                    </div>
                </el-aside>
                <el-main>
                    <el-form :model="form" :rules="rules" label-width="auto" size="large" ref="ruleFormRef">
                        <el-form-item prop="phone" required>
                            <el-input placeholder='手机号码' v-model="form.phone" />
                        </el-form-item>
                        <el-form-item prop="email" required>
                            <el-input placeholder='电子邮箱' v-model="form.email" />
                        </el-form-item>
                        <el-form-item prop="password" required>
                            <el-input show-password placeholder='密码' v-model="form.password" type="password"/>
                        </el-form-item>
                        <el-form-item prop="recheckPassword" required>
                            <el-input show-password placeholder='确认密码' v-model="form.recheckPassword" type="password"/>
                        </el-form-item>
                        <el-row :gutter="0">
                          <!-- 跳转回登录页面 -->
                          <el-col :span="6" :offset="9">
                            <router-link to="/login">
                              <el-button style="width: 100%;">返回登录</el-button>
                            </router-link>
                          </el-col>
                          <el-col :span="6" :offset="3">
                              <el-button style="width: 100%;" type="primary" @click="registerUser(ruleFormRef)">注册</el-button>
                          </el-col>
                        </el-row>
                    </el-form>
                </el-main>
            </el-container>
        </div>
    </div>
</template>


<style scoped>
.register {
    position: absolute;
    top: 40%;
    left: 50%;
    transform: translate(-50%, -50%);

    display: flex;
    justify-content: center;
    align-items: center;

    background-color: #ffffff;
}

.register-form {
    min-width: 60em;
    padding: 1em;
    border: 2px solid #c6e2ff;
    border-radius: 20px;
}
</style>
