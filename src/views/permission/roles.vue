<template>
  <div class="rolesControl">
    <el-card>
      <el-button type="primary" @click="addRolesTab">添加权限</el-button>
			<el-button type="primary" @click="refreshTable">刷新列表</el-button>

      <el-table
        class="mtop30"
        :data="rolesTab"
        stripe
        border
        style="width: 100%;"
      >
        <el-table-column prop="key" label="身份"></el-table-column>

        <el-table-column prop="description" label="说明"></el-table-column>

        <el-table-column label="操作">
          <template slot-scope="scope">
            <el-button
              type="primary"
              @click="editRoles(scope.$index, scope.row)"
              >编辑</el-button
            >
            <el-button
              type="warning"
              @click="deleteRoles(scope.$index, scope.row)"
              :disabled="isAdmin(scope.row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog title="权限编辑" :visible.sync="diaIsShow" class="diaForm">
      <el-form
        ref="rolesForm"
        :model="formData"
        :rules="rules"
        label-width="140px"
      >
				<div v-if="this.editType === 'add'">
					<el-form-item label="编码" prop="code">
						<el-input
							type="text"
							placeholder="请输入要添加的角色编码"
							v-model="formData.code"
						></el-input>
					</el-form-item>
				</div>
				
        <el-form-item label="名称" prop="key">
          <el-input
            type="text"
            placeholder="请输入要添加的角色名称"
            v-model="formData.key"
          ></el-input>
        </el-form-item>

        <el-form-item label="说明" prop="description">
          <el-input
            type="text"
            placeholder="请输入相关说明"
            v-model="formData.description"
          ></el-input>
        </el-form-item>

        <el-form-item label="菜单">
          <el-tree
            :data="treeData"
            ref="tree"
            node-key="name"
            :props="defaultProps"
            show-checkbox
            :check-strictly="false"
          ></el-tree>
        </el-form-item>
				
        <el-form-item>
          <el-button type="primary" @click="changeRoles('rolesForm', editType)"
            >确认</el-button
          >
          <el-button @click="diaIsShow = false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
import { getAllRoles, addRole, updateRole, deleteRole } from '@/api/roles'
import { asyncRoutes, currencyRoutes } from '@/router'

/**
 * 刷新数据列表
 * 
 * @param {Object} pointer
 * @param {Integer} pageIndex
 * @param {Integer} pageCapacity
 */
function refreshTable (pointer, pageIndex, pageCapacity) {
	pointer.rolesTab = []
	pointer.treeData = []
	pointer._getAllRoles()
	pointer.treeData = pointer.getTreeData(pointer.allRoute)
}

/**
 * 重置当前操作页面数据
 * 
 * @param {Object} pointer	- 指针对象
 */
function resetFormData (pointer) {
	pointer.formData = {
		code: '',
		key: '',
		description: '',
		oldRole_name: '',
		oldRole_description: ''
	}
}

export default {
  data() {
    return {
      rolesTab: [],
      diaIsShow: false,
			// 表单数据
      formData: {
				code: '',
				key: '',
				description: '',
				oldRole_name: '',
				oldRole_description: ''
			},
      editType: 'update',
      rules: {
        key: [
          {
            required: true,
            message: '请输入要添加的身份类别',
            trigger: 'blur'
          }
        ],
        description: [
          {
            required: true,
            message: '请输入相关说明',
            trigger: 'blur'
          }
        ]
      },
      editIndex: 0,
      allRoute: [...currencyRoutes, ...asyncRoutes],
      treeData: [],
      defaultProps: {
        label: 'label',
        children: 'children'
      }
    }
  },
  created() {
    /* this._getAllRoles()
    this.treeData = this.getTreeData(this.allRoute) */
		refreshTable(this)
  },
  methods: {
    _getAllRoles() {
      getAllRoles()
        .then(res => {
          /* this.rolesTab = res.data.allRoles */
					if (res) {
						const roles = res
						for (let role of roles) {
							let roleData = {
								code: role['code'],
								key: role['name'],
								description: role['description']
							}
							this.rolesTab.push(roleData)
						}
					}
        }).catch(error => {
          this.$message.error(error)
        })
    },
    isAdmin(row) {
      return row.code === 'ADMIN'
    },
		// 添加角色 - 页面初始化
    addRolesTab() {
      this.diaIsShow = true
      this.editType = 'add'
			
			// 初始化表单数据
      resetFormData(this)
			
      this.$nextTick(() => {
        this.$refs.rolesForm.clearValidate()
        this.$refs.tree.setCheckedKeys([])
      })
    },
		// 编辑角色 - 页面初始化
    editRoles(index, row) {
      this.diaIsShow = true
      this.editIndex = index
			// 操作类型（添加 / 编辑）
      this.editType = 'update'
			// 表单数据
      this.formData = Object.assign({}, this.formData, {
				code: row.code,
        key: row.key,
        description: row.description,
				oldRole_name: row.key,
				oldRole_description: row.description
      })
			
      this.$nextTick(() => {
        this.$refs.rolesForm.clearValidate()
				// 设置下拉树数据
        this.$refs.tree.setCheckedKeys(row.pages ? row.pages : [])
      })
    },
		// 修改角色 - 数据交互
    changeRoles(form, type) {
      this.$refs[form].validate(valid => {
        if (valid) {
          let treeKeys = this.$refs.tree.getCheckedKeys()
					
          if (type === 'update') {
						//=== 服务器接口交互 ===//
						let oldRole = {
							code: this.formData.code,
							name: this.formData.oldRole_name,
							description: this.formData.oldRole_description
						}
						let newRole = {
							name: this.formData.key,
							description: this.formData.description
						}
						
						updateRole(oldRole, newRole)
							.then(res => {
							if (res 
								&& res.message 
								&& res.description) {
								if (res.status === true) {
									//=== 页面缓存
									let index = this.editIndex
									let roleTab = this.rolesTab[index]
									
									roleTab.code = this.formData.code
									roleTab.key = this.formData.key
									roleTab.description = this.formData.description
									roleTab.pages = treeKeys
									
									this.$notify({
										title: '成功',
										message: '权限修改成功',
										type: 'success'
									})
								} else {
									this.$notify({
										title: '失败',
										message: '权限修改失败；' + res.description,
										type: 'failure'
									})
									
									// 刷新列表
									refreshTable(this)
								}
							} else {
								this.$notify({
									title: '失败',
									message: '接口数据异常；请联系管理员处理！',
									type: 'failure'
								})
							}
						}).catch(err => {
							console.error(err)
							
							this.$notify({
								title: '失败',
								message: '接口异常；请联系管理员处理！',
								type: 'failure'
							})
						})
						//======//
          } else if (type === 'add') {
						//=== 服务器接口交互 ===//
						let newRole = {
							code: this.formData.code,
							name: this.formData.key,
							description: this.formData.description
						}
						
						addRole(newRole)
							.then(res => {
							if (res 
								&& res.message 
								&& res.description) {
								if (res.status === true) {
									/* //=== 页面缓存
									 let newTab = {}
									
									newTab.key = this.formData.key
									newTab.description = this.formData.description
									newTab.pages = treeKeys
									
									this.rolesTab.push(newTab) */
									this.$notify({
									  title: '成功',
									  message: '权限添加成功',
									  type: 'success'
									})
									
									// 刷新列表
									refreshTable(this)
								} else {
									this.$notify({
										title: '失败',
										message: '权限修改失败；' + res.description,
										type: 'failure'
									})
									
									// 刷新列表
									refreshTable(this)
								}
							} else {
								this.$notify({
									title: '失败',
									message: '接口数据异常；请联系管理员处理！',
									type: 'failure'
								})
							}
						}).catch(err => {
							console.error(err)
							
							this.$notify({
								title: '失败',
								message: '接口异常；请联系管理员处理！',
								type: 'failure'
							})
						})
						//======//
          }
          this.diaIsShow = false
        } else {
          return
        }
      })
    },
		deleteRoles(index, row) {
		  this.$confirm('此操作将永久删除相关数据, 是否继续?', '提示', {
		    confirmButtonText: '确定',
		    cancelButtonText: '取消',
		    type: 'warning'
		  }).then(() => {
				//=== 服务器接口交互 ===//
				let role = {
					code: row.code,
					name: row.name,
					description: row.description
				}
				
				deleteRole(role)
					.then(res => {
					if (res 
						&& res.message 
						&& res.description) {
						if (res.status === true) {
							this.$notify({
							  title: '成功',
							  message: '角色删除成功',
							  type: 'success'
							})
							
							// 刷新列表
							refreshTable(this)
							
							this.$message({
								type: 'success',
								message: '删除成功!'
							})
						} else {
							this.$notify({
								title: '失败',
								message: '角色删除失败；' + res.description,
								type: 'failure'
							})
							
							// 刷新列表
							refreshTable(this)
						}
					} else {
						this.$notify({
							title: '失败',
							message: '接口数据异常；请联系管理员处理！',
							type: 'failure'
						})
					}
				}).catch(err => {
					console.error(err)
					
					this.$notify({
						title: '失败',
						message: '接口异常；请联系管理员处理！',
						type: 'failure'
					})
				})
				//======//
			}).catch(() => {
				this.$message({
					type: 'info',
					message: '已取消删除'
				})
			})
		},
    getTreeData(route) {
      let arrBox = []
			
			if (route) {
				for (let item of route) {
					if (item.hidden) continue
					
					let onlyChild = this.hasOnlyChild(item.children, item)
					if (onlyChild && !onlyChild.children) {
						item = onlyChild
					}
					
					let data = {
						label: item.meta.title,
						name: item.name
					}
					if (item.children) {
						data.children = this.getTreeData(item.children)
					}
					arrBox.push(data)
				}
			}
      return arrBox
    },
    hasOnlyChild(children = [], item) {
      let newChildren = children.filter(item => {
        return !item.hidden
      })

      if (newChildren.length === 1 && !item.meta) {
        return newChildren[0]
      } else if (newChildren.length === 0) {
        return item
      }
      return false
    },
    forSearchArr(route, roles) {
      let arrNew = []
			
			if (route) {
				for (let item of route) {
					let itemNew = { ...item } //解决浅拷贝共享同一内存地址
					if (roles.includes(itemNew.name)) {
						if (itemNew.children) {
							itemNew.children = this.forSearchArr(itemNew.children, roles)
						}
						arrNew.push(itemNew)
					}
				}
			}
      return arrNew
    },
		/**
		 * 刷新列表
		 */
		refreshTable () {
			return refreshTable(this)
		}
  }
}
</script>

<style scoped lang="scss">
.rolesControl .mtop30 .el-button {
  padding: 8px 18px;
  font-size: 12px;
}
.diaForm {
  .el-input {
    width: 350px;
  }
}
</style>

<style lang="scss">
.diaForm .el-form-item__label {
  padding-right: 12px;
}
</style>
